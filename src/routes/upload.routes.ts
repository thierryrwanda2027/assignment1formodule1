import { Router } from "express";
import upload from "../config/multer";
import { 
  uploadAvatar, 
  deleteAvatar, 
  uploadListingPhotos, 
  deleteListingPhoto 
} from "../controllers/upload.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post("/users/:id/avatar", authenticate, upload.single("image"), uploadAvatar);

/**
 * @swagger
 * /users/{id}/avatar:
 *   delete:
 *     summary: Delete user avatar
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 */
router.delete("/users/:id/avatar", authenticate, deleteAvatar);

/**
 * @swagger
 * /listings/{id}/photos:
 *   post:
 *     summary: Upload listing photos (max 5)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 */
router.post("/listings/:id/photos", authenticate, upload.array("photos", 5), uploadListingPhotos);

/**
 * @swagger
 * /listings/{id}/photos/{photoId}:
 *   delete:
 *     summary: Delete a specific listing photo
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete("/listings/:id/photos/:photoId", authenticate, deleteListingPhoto);

export default router;
