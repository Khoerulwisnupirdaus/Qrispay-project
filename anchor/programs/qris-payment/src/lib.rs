use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

mod error;
use error::QrisPaymentError;

// Program ID — replace with actual deployed program ID
declare_id!("QRiSPay1111111111111111111111111111111111111");

/// Rialo QRIS Payment Lock Program
///
/// This program implements an escrow-based payment flow:
/// 1. User locks USDC tokens into an escrow PDA
/// 2. Middleware confirms fiat QRIS settlement
/// 3. Tokens are released to treasury or refunded on timeout
#[program]
pub mod qris_payment {
    use super::*;

    /// Lock timeout duration in seconds (15 minutes).
    /// If payment is not confirmed within this window, user can reclaim funds.
    const LOCK_TIMEOUT: i64 = 900;

    /// Initialize the global payment configuration.
    /// Sets the middleware authority and treasury wallet addresses.
    ///
    /// # Arguments
    /// * `ctx` - Context containing the config account and authority signer
    /// * `middleware_authority` - Public key of the middleware server wallet
    /// * `treasury` - Public key of the treasury that receives settled payments
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        middleware_authority: Pubkey,
        treasury: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.middleware_authority = middleware_authority;
        config.treasury = treasury;
        config.total_payments = 0;
        config.bump = ctx.bumps.config;

        msg!("QRIS Payment config initialized");
        Ok(())
    }

    /// Lock user's USDC tokens into escrow for a QRIS payment.
    /// Creates a new payment record and transfers tokens to the escrow vault.
    ///
    /// # Arguments
    /// * `ctx` - Context with user token account, escrow vault, and payment record
    /// * `amount` - Amount of USDC (in smallest unit, e.g., 6 decimals) to lock
    /// * `idr_amount` - Equivalent IDR amount for the QRIS payment
    /// * `qris_data` - Raw QRIS payload string from the merchant QR code
    /// * `exchange_rate` - USD/IDR rate used for conversion (scaled by 100)
    pub fn lock_payment(
        ctx: Context<LockPayment>,
        amount: u64,
        idr_amount: u64,
        qris_data: String,
        exchange_rate: u64,
    ) -> Result<()> {
        // Validate the payment amount
        require!(amount > 0, QrisPaymentError::InvalidAmount);
        require!(qris_data.len() > 0, QrisPaymentError::InvalidQrisData);
        require!(exchange_rate > 0, QrisPaymentError::InvalidExchangeRate);

        // Transfer tokens from user to escrow vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Record payment details
        let payment = &mut ctx.accounts.payment;
        payment.user = ctx.accounts.user.key();
        payment.amount = amount;
        payment.idr_amount = idr_amount;
        payment.qris_data = qris_data;
        payment.exchange_rate = exchange_rate;
        payment.status = PaymentStatus::Locked;
        payment.created_at = Clock::get()?.unix_timestamp;
        payment.settled_at = 0;
        payment.bump = ctx.bumps.payment;

        // Increment global payment counter
        let config = &mut ctx.accounts.config;
        config.total_payments += 1;

        msg!(
            "Payment locked: {} USDC for {} IDR",
            amount,
            idr_amount
        );

        // Emit event for middleware to listen to
        emit!(PaymentLocked {
            payment_id: payment.key(),
            user: payment.user,
            amount,
            idr_amount,
            qris_data: payment.qris_data.clone(),
        });

        Ok(())
    }

    /// Confirm that the QRIS fiat payment was successfully settled.
    /// Only callable by the authorized middleware wallet.
    /// Transfers escrowed tokens to the treasury.
    ///
    /// # Arguments
    /// * `ctx` - Context with middleware signer, escrow vault, and treasury
    /// * `gateway_reference` - Payment reference ID from Xendit/Midtrans
    pub fn confirm_payment(
        ctx: Context<ConfirmPayment>,
        gateway_reference: String,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;

        // Ensure payment is still in locked state
        require!(
            payment.status == PaymentStatus::Locked,
            QrisPaymentError::AlreadySettled
        );

        // Check that caller is the middleware authority
        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.middleware_authority,
            QrisPaymentError::Unauthorized
        );

        // Transfer tokens from escrow to treasury
        let seeds = &[
            b"escrow",
            payment.user.as_ref(),
            &payment.created_at.to_le_bytes(),
            &[ctx.accounts.escrow_vault.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: ctx.accounts.escrow_vault.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, payment.amount)?;

        // Update payment status
        payment.status = PaymentStatus::Confirmed;
        payment.settled_at = Clock::get()?.unix_timestamp;

        msg!("Payment confirmed with gateway ref: {}", gateway_reference);

        emit!(PaymentConfirmed {
            payment_id: payment.key(),
            user: payment.user,
            amount: payment.amount,
            gateway_reference,
        });

        Ok(())
    }

    /// Cancel and refund a payment that has timed out.
    /// Anyone can call this after the lock timeout has elapsed.
    ///
    /// # Arguments
    /// * `ctx` - Context with payment record and escrow vault
    pub fn cancel_payment(ctx: Context<CancelPayment>) -> Result<()> {
        let payment = &mut ctx.accounts.payment;

        // Ensure payment is still locked
        require!(
            payment.status == PaymentStatus::Locked,
            QrisPaymentError::AlreadySettled
        );

        // Check that timeout has elapsed
        let now = Clock::get()?.unix_timestamp;
        require!(
            now > payment.created_at + LOCK_TIMEOUT,
            QrisPaymentError::PaymentNotExpired
        );

        // Refund tokens from escrow back to user
        let seeds = &[
            b"escrow",
            payment.user.as_ref(),
            &payment.created_at.to_le_bytes(),
            &[ctx.accounts.escrow_vault.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.escrow_vault.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, payment.amount)?;

        payment.status = PaymentStatus::Cancelled;
        payment.settled_at = now;

        msg!("Payment cancelled and refunded");

        emit!(PaymentCancelled {
            payment_id: payment.key(),
            user: payment.user,
            amount: payment.amount,
        });

        Ok(())
    }
}

// ============================================================
// Account Structures
// ============================================================

/// Global configuration account for the QRIS payment program.
#[account]
pub struct PaymentConfig {
    /// Admin who initialized the config
    pub admin: Pubkey,
    /// Middleware server wallet authorized to confirm payments
    pub middleware_authority: Pubkey,
    /// Treasury wallet that receives settled payment tokens
    pub treasury: Pubkey,
    /// Total number of payments processed
    pub total_payments: u64,
    /// PDA bump seed
    pub bump: u8,
}

/// Individual payment record stored on-chain.
#[account]
pub struct Payment {
    /// User who initiated the payment
    pub user: Pubkey,
    /// Amount of USDC locked (in token smallest unit)
    pub amount: u64,
    /// IDR amount for the QRIS payment
    pub idr_amount: u64,
    /// Raw QRIS data from merchant QR code
    pub qris_data: String,
    /// USD/IDR exchange rate used (scaled by 100)
    pub exchange_rate: u64,
    /// Current payment status
    pub status: PaymentStatus,
    /// Unix timestamp when payment was created
    pub created_at: i64,
    /// Unix timestamp when payment was settled (confirmed/cancelled)
    pub settled_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

/// Escrow vault PDA that holds locked tokens.
#[account]
pub struct EscrowVault {
    /// PDA bump seed
    pub bump: u8,
}

/// Payment lifecycle status.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    /// Tokens are locked in escrow, awaiting fiat settlement
    Locked,
    /// Fiat payment confirmed, tokens sent to treasury
    Confirmed,
    /// Payment cancelled/timed out, tokens refunded
    Cancelled,
}

// ============================================================
// Instruction Contexts
// ============================================================

/// Accounts required to initialize the global config.
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 32 + 8 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, PaymentConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Accounts required to lock a payment into escrow.
#[derive(Accounts)]
#[instruction(amount: u64, idr_amount: u64, qris_data: String, exchange_rate: u64)]
pub struct LockPayment<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, PaymentConfig>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + (4 + 256) + 8 + 1 + 8 + 8 + 1,
        seeds = [b"payment", user.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub payment: Account<'info, Payment>,

    #[account(
        init,
        payer = user,
        token::mint = token_mint,
        token::authority = escrow_vault,
        seeds = [b"escrow", user.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Accounts required to confirm a settled payment.
#[derive(Accounts)]
pub struct ConfirmPayment<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, PaymentConfig>,

    #[account(
        mut,
        seeds = [b"payment", payment.user.as_ref(), &payment.created_at.to_le_bytes()],
        bump = payment.bump,
    )]
    pub payment: Account<'info, Payment>,

    #[account(
        mut,
        seeds = [b"escrow", payment.user.as_ref(), &payment.created_at.to_le_bytes()],
        bump,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

/// Accounts required to cancel and refund an expired payment.
#[derive(Accounts)]
pub struct CancelPayment<'info> {
    #[account(
        mut,
        seeds = [b"payment", payment.user.as_ref(), &payment.created_at.to_le_bytes()],
        bump = payment.bump,
    )]
    pub payment: Account<'info, Payment>,

    #[account(
        mut,
        seeds = [b"escrow", payment.user.as_ref(), &payment.created_at.to_le_bytes()],
        bump,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == payment.user
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ============================================================
// Events — Emitted for middleware consumption
// ============================================================

/// Emitted when a user locks USDC for a QRIS payment.
#[event]
pub struct PaymentLocked {
    pub payment_id: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub idr_amount: u64,
    pub qris_data: String,
}

/// Emitted when the middleware confirms fiat settlement.
#[event]
pub struct PaymentConfirmed {
    pub payment_id: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub gateway_reference: String,
}

/// Emitted when a payment is cancelled/refunded.
#[event]
pub struct PaymentCancelled {
    pub payment_id: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}
