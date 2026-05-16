use anchor_lang::prelude::*;

/// Custom error codes for the QRIS Payment Lock program.
/// These provide meaningful error messages for various failure scenarios.
#[error_code]
pub enum QrisPaymentError {
    /// The payment amount must be greater than zero.
    #[msg("Payment amount must be greater than zero")]
    InvalidAmount,

    /// The payment has already been confirmed or cancelled.
    #[msg("Payment has already been settled")]
    AlreadySettled,

    /// The payment is still pending and cannot be finalized yet.
    #[msg("Payment is still pending")]
    StillPending,

    /// Only the authorized middleware wallet can confirm payments.
    #[msg("Unauthorized: only middleware authority can confirm")]
    Unauthorized,

    /// The payment lock has expired (timeout exceeded).
    #[msg("Payment lock has expired")]
    PaymentExpired,

    /// The payment lock has not yet expired for refund.
    #[msg("Payment lock has not yet expired")]
    PaymentNotExpired,

    /// Invalid QRIS data provided.
    #[msg("Invalid QRIS data")]
    InvalidQrisData,

    /// Exchange rate is stale or invalid.
    #[msg("Invalid or stale exchange rate")]
    InvalidExchangeRate,
}
