import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: isProduction,
    // In dev: 'Lax' works fine for same-origin (localhost:5001 → localhost:5173)
    // In prod: 'None' + Secure for cross-origin (Render → Vercel)
    sameSite: isProduction ? 'None' : 'Lax',
  });

  return token;
};
