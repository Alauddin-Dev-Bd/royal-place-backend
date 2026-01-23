import { Router } from "express";
import { authenticateUser } from "../middleware/authenticateUser";
import { authorizeRoles } from "../middleware/authorizeRoles";
import upload from "../middleware/uploadMiddleware";
import { amenitieController } from "../controllers/amenitie.contollers";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Amenities
 *     description: Manage hotel amenities/services
 *
 * /api/v1/amenities:
 *   get:
 *     summary: Get all amenities
 *     tags: [Amenities]
 *     responses:
 *       200:
 *         description: List of all amenities
 *
 *   post:
 *     summary: Create a new amenity
 *     tags: [Amenities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - pricePerDay
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               pricePerDay:
 *                 type: number
 *               isServiceFree:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *
 * /api/v1/amenities/{id}:
 *   patch:
 *     summary: Update an existing amenity
 *     tags: [Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               pricePerDay:
 *                 type: number
 *               isServiceFree:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *
 *   delete:
 *     summary: Delete an amenity
 *     tags: [Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 */

router.get("/", amenitieController.getAllAmenities);
router.post(
  "/",
  authenticateUser,
  authorizeRoles("admin"),
  upload.single("image"),
  amenitieController.createAmenitie
);
router.patch(
  "/:id",
  authenticateUser,
  authorizeRoles("admin"),
  upload.single("image"),
  amenitieController.updateAmenitie
);
router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("admin"),
  amenitieController.deleteAmenitie
);

export const serviceRoute = router;
