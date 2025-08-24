export const simulatePaymentProcessing = async (payment) => {
  // Simulate payment processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate random success/failure (90% success rate)
  const isSuccess = Math.random() > 0.1;
  
  if (isSuccess) {
    return {
      success: true,
      receiptUrl: `https://receipts.example.com/${payment.transactionId}`,
      message: 'Payment processed successfully'
    };
  } else {
    return {
      success: false,
      message: 'Payment failed. Please try again.'
    };
  }
};