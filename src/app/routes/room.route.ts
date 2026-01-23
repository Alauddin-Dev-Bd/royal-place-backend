import { Router } from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import { authorizeRoles } from "../middleware/authorizeRoles";
import upload from "../middleware/uploadMiddleware";
import { roomController } from "../controllers/room.controllers";

const router = Router();
/**
 * @openapi
 * tags:
 *   - name: Rooms
 *     description: Room management endpoints (CRUD operations)
 *
 * /api/v1/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - roomNumber
 *               - floor
 *               - title
 *               - type
 *               - bedType
 *               - bedCount
 *             properties:
 *               roomNumber:
 *                 type: string
 *                 example: "101"
 *               floor:
 *                 type: number
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: "Deluxe Room"
 *               type:
 *                 type: string
 *                 enum: [standard, deluxe, suite]
 *                 example: deluxe
 *               price:
 *                 type: number
 *                 example: 1500
 *               adults:
 *                 type: number
 *                 example: 2
 *               children:
 *                 type: number
 *                 example: 1
 *               bedType:
 *                 type: string
 *                 enum: [single, double, queen, king]
 *                 example: queen
 *               bedCount:
 *                 type: number
 *                 example: 2
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Air Conditioning", "Free WiFi", "TV"]
 *               description:
 *                 type: string
 *                 example: "A spacious deluxe room with sea view"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       '201':
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       '200':
 *         description: List of all rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *
 * /api/v1/rooms/{id}:
 *   get:
 *     summary: Get a single room by ID
 *     tags: [Rooms]
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
 *         description: Room fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       '404':
 *         description: Room not found
 *
 *   patch:
 *     summary: Update a room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomNumber:
 *                 type: string
 *               floor:
 *                 type: number
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [standard, deluxe, suite]
 *               price:
 *                 type: number
 *               adults:
 *                 type: number
 *               children:
 *                 type: number
 *               bedType:
 *                 type: string
 *                 enum: [single, double, queen, king]
 *               bedCount:
 *                 type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       '404':
 *         description: Room not found
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *
 *   delete:
 *     summary: Delete a room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Room deleted successfully
 *       '404':
 *         description: Room not found
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f8b7a1d2f0d9b2c0a98765"
 *         roomNumber:
 *           type: string
 *           example: "101"
 *         floor:
 *           type: number
 *           example: 1
 *         title:
 *           type: string
 *           example: "Deluxe Room"
 *         type:
 *           type: string
 *           enum: [standard, deluxe, suite]
 *           example: deluxe
 *         price:
 *           type: number
 *           example: 1500
 *         adults:
 *           type: number
 *           example: 2
 *         children:
 *           type: number
 *           example: 1
 *         maxOccupancy:
 *           type: number
 *           example: 3
 *         bedType:
 *           type: string
 *           enum: [single, double, queen, king]
 *           example: queen
 *         bedCount:
 *           type: number
 *           example: 2
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Air Conditioning", "Free WiFi", "TV"]
 *         description:
 *           type: string
 *           example: "A spacious deluxe room with sea view"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         roomStatus:
 *           type: string
 *           enum: [Active, Inactive, Maintenance]
 *           example: Active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * securitySchemes:
 *   bearerAuth:
 *     type: http
 *     scheme: bearer
 *     bearerFormat: JWT
 */

/* ================= ROUTES ================= */
router.post(
  "/",
  authenticateUser,
  authorizeRoles("admin", "receptionist", "guest"),
  upload.array("images", 5),
  roomController.createRoom
);

router.get("/", roomController.getAllRooms);
router.get("/:id", roomController.getRoomById);

router.patch(
  "/:id",
  authenticateUser,
  authorizeRoles("admin", "receptionist"),
  roomController.updateRoom
);

router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("admin", "receptionist"),
  roomController.deleteRoom
);

export const roomRoute = router;
