import mongoose, { Types } from "mongoose";
import { Comment } from "../../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../../models/video.model.js";
import { getMongoosePaginationOptions } from "../utils/helper.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const commentAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  const comments = await Comment.aggregatePaginate(
    commentAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalComments",
        docs: "comments",
      },
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(201, comments, "all comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId) throw new ApiError(422, "videoId is required");

  const videoExists = await Video.findById(videoId);
  if (!videoExists) throw new ApiError(400, "video doesn't exists");

  if (!content) throw new ApiError(422, "comment is required");

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment)
    throw new ApiError(500, "something went wrong while trying to comment");

  return res
    .status(200)
    .json(new ApiResponse(201, comment, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) throw new ApiError(422, "commentId is required");

  const commentExists = await Comment.findById(commentId);
  if (!commentExists) throw new ApiError(400, "comment doesn't exists");

  if (!(Comment.owner.toString() === req.user?._id.toString()))
    throw new ApiError(400, "unathorized access");

  if (!content) throw new ApiError(422, "comment is required");

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    { new: true }
  );

  if (!comment)
    throw new ApiError(
      500,
      "something went wrong while trying to update the comment"
    );

  return res
    .status(200)
    .json(new ApiResponse(201, comment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "Comment doesn't exist");
  }

  if (!(comment.owner.toString() === req.user?._id.toString())) {
    throw new ApiError(403, "Unauthorized access");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "Unable to delete the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
