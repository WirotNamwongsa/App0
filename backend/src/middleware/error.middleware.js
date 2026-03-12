// src/middleware/error.middleware.js
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'ข้อมูลซ้ำในระบบ' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'ไม่พบข้อมูล' });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'ข้อมูลไม่ถูกต้อง',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'เกิดข้อผิดพลาดในระบบ',
  });
};

module.exports = { errorHandler };
