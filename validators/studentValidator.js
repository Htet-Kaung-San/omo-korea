const Joi = require('joi');

// Schema for creating a forum post
const createPostSchema = Joi.object({
  board_id: Joi.number().integer().required().messages({
    'number.base': 'Board ID must be a number.',
    'any.required': 'Board ID is required.'
  }),
  student_id: Joi.number().integer().required().messages({
    'number.base': 'Student ID must be a number.',
    'any.required': 'Student ID is required.'
  }),
  title: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Title cannot be empty.',
    'string.min': 'Title must be at least 2 characters long.',
    'any.required': 'Title is required.'
  }),
  content: Joi.string().trim().min(5).required().messages({
    'string.empty': 'Content cannot be empty.',
    'string.min': 'Content must be at least 5 characters long.',
    'any.required': 'Content is required.'
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  nationality: Joi.string().trim().max(100),
  major: Joi.string().trim().max(120),
  interests: Joi.array().items(Joi.string().trim().max(50)),
  language_pref: Joi.string().trim().max(50),
  visa_status: Joi.string().trim().max(30),
  mbti: Joi.string().trim().max(4),
  phone: Joi.string().trim().max(30),
})
  .min(1)
  .messages({
    'object.min': 'At least one profile field is required.',
  });

const createCommentSchema = Joi.object({
  student_id: Joi.number().integer().required().messages({
    'number.base': 'Student ID must be a number.',
    'any.required': 'Student ID is required.',
  }),
  content: Joi.string().trim().min(2).max(500).required().messages({
    'string.empty': 'Content cannot be empty.',
    'string.min': 'Content must be at least 2 characters long.',
    'string.max': 'Content cannot exceed 500 characters.',
    'any.required': 'Content is required.',
  }),
});

// Middleware helper to execute the validation
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      // Format the error messages nicely for the frontend team
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    
    next();
  };
};

module.exports = {
  createPostSchema,
  createCommentSchema,
  updateProfileSchema,
  validateBody,
};