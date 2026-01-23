import { Router } from "express";
import { testimonialController } from "../controllers/testimonial.controllers";

const router = Router();
/**
 * @openapi
 * tags:
 *   - name: Testimonials
 *     description: Manage user testimonials for rooms
 *
 * /api/v1/testimonials:
 *   post:
 *     summary: Create a new testimonial
 *     tags: [Testimonials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userName
 *               - userImage
 *               - roomId
 *               - rating
 *               - reviewText
 *               - reviewDate
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64f8a7b5d2f0d9b2c0a12345"
 *               userName:
 *                 type: string
 *                 example: "John Doe"
 *               userImage:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/avatar.jpg"
 *               roomId:
 *                 type: string
 *                 example: "64f8b7a1d2f0d9b2c0a98765"
 *               rating:
 *                 type: number
 *                 example: 4.5
 *               reviewText:
 *                 type: string
 *                 example: "Amazing room and service!"
 *               reviewDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-29"
 *     responses:
 *       '201':
 *         description: Testimonial created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Testimonial'
 *       '400':
 *         description: Validation error
 *
 *   get:
 *     summary: Get all testimonials
 *     tags: [Testimonials]
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       '200':
 *         description: List of testimonials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Testimonial'
 *
 * /api/v1/testimonials/{id}:
 *   get:
 *     summary: Get testimonials for a specific room by room ID
 *     tags: [Testimonials]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Room ID
 *         schema:
 *           type: string
 *           example: "64f8b7a1d2f0d9b2c0a98765"
 *     responses:
 *       '200':
 *         description: Testimonials for the room fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Testimonial'
 *       '404':
 *         description: Room or testimonials not found
 *
 *   delete:
 *     summary: Delete a testimonial by ID (hard delete)
 *     tags: [Testimonials]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Testimonial ID
 *         schema:
 *           type: string
 *           example: "64f8c8b1d2f0d9b2c0a65432"
 *     responses:
 *       '200':
 *         description: Testimonial deleted successfully
 *       '404':
 *         description: Testimonial not found
 *
 * components:
 *   schemas:
 *     Testimonial:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f8c8b1d2f0d9b2c0a65432"
 *         userId:
 *           type: string
 *           example: "64f8a7b5d2f0d9b2c0a12345"
 *         userName:
 *           type: string
 *           example: "John Doe"
 *         userImage:
 *           type: string
 *           format: uri
 *           example: "https://example.com/avatar.jpg"
 *         roomId:
 *           type: string
 *           example: "64f8b7a1d2f0d9b2c0a98765"
 *         rating:
 *           type: number
 *           example: 4.5
 *         reviewText:
 *           type: string
 *           example: "Amazing room and service!"
 *         reviewDate:
 *           type: string
 *           format: date
 *           example: "2025-11-29"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// ===========================Create a new testimonial==============================
router.post("/", testimonialController.testimonialCreate);

// =========================Get all testimonials==============================
router.get("/", testimonialController.findAllTestimonials);

//======================= Get testimonials by specific room ID===============================
router.get("/:id", testimonialController.findTestimonialsByRoomId);
// =======================Delete testimonial by ID (hard delete)==============================
router.delete("/:id", testimonialController.deleteTestimonialById); // 👈 added line

export const testimonialRoute= router;
