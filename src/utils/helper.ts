export const formatValidationError = (error: any) => {
  const errorDetails = error.details.map((err: any) => ({
    key: err.context.key,
    message: err.message,
  }));
  return errorDetails;
};
