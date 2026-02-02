import joi from "joi";

export const listingSchema = joi.object({
    listing : joi.object({
        title : joi.string().required(),
        description : joi.string().required(),
        image : joi.string().allow("" , null),
        price : joi.number().required().min(0),
        location : joi.string().required(),
        country : joi.string().required(),
        category: joi.string().valid("Homes", "Experiences", "Services").required()
    }).required()
})

export const reviewSchema = joi.object({
    review : joi.object({
        rating : joi.number().required().min(1).max(5),
        comment : joi.string().required(),
        createdAt : joi.date()
    }).required()
})