const apiResponse = {
  success: (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },
  error: (res, message, statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  },
};

export default apiResponse;

/**
 * Named export: sendSuccess
 * 4th arg can be:
 *   - a number (statusCode), e.g. sendSuccess(res, msg, data, 201)
 *   - an object (pagination meta), e.g. sendSuccess(res, msg, data, { page, total })
 */
export const sendSuccess = (res, message, data = null, metaOrStatusCode = 200) => {
  let statusCode = 200;
  let meta = null;

  if (typeof metaOrStatusCode === 'number') {
    statusCode = metaOrStatusCode;
  } else if (metaOrStatusCode && typeof metaOrStatusCode === 'object') {
    meta = metaOrStatusCode;
  }

  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

/**
 * Named export: sendError
 */
export const sendError = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
