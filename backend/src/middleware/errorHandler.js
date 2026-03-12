export function errorHandler(err, req, res, next) {
  console.error(err)
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({ error: message })
}

export function createError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}
