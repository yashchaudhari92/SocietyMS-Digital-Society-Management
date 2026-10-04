const isUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Access denied (User only)" });
  }

  next();
};

module.exports = isUser;