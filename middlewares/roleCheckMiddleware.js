const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin access required" });
  next();
};
const isUser = (req, res, next) => {
  if (req.user.role !== "USER")
    return res.status(403).json({ message: "User access required" });
  next();
};

module.exports = {
    isAdmin,
    isUser
};