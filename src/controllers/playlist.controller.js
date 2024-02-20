import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  if ([name, description].some((field) => field?.trim === ""))
    throw new ApiError(422, "playlist name or description can't be empty");

  const playlistExists = await Playlist.findOne({ name, owner: req.user?._id });

  if (playlistExists) throw new ApiError(422, "playlist already exists");

  const createdPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!createdPlaylist)
    throw new ApiError(500, "something went wrong while creating the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(201, createdPlaylist, "playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) throw new ApiError(422, "userId is required");

  const playlist = await Playlist.find({
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (!playlist) throw new ApiError(401, "no playlist found");

  return res
    .status(200)
    .json(new ApiResponse(201, { playlist }, "playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId) throw new ApiError(422, "playlistId is required");

  if (!isValidObjectId(playlistId))
    throw new ApiResponse(422, "invalid playlistId");

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) throw new ApiError(401, "no playlist found");

  return res
    .status(200)
    .json(new ApiResponse(201, { playlist }, "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: add video to the playlist
  if (!playlistId || !videoId)
    throw new ApiError(422, "videoId or playlistId is missng");

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    throw new ApiError(422, "Invalid videoId or playlistId");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "video doesn't exists");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(400, "playlist doesn't exists");
  let videoAddedToPlaylist;
  if (!playlist.videos.includes(videoId)) {
    videoAddedToPlaylist = await Playlist.findByIdAndUpdate(
      { _id: playlistId },
      { $push: { videos: videoId } },
      { new: true }
    );

    if (!videoAddedToPlaylist)
      throw new ApiError(
        500,
        "something went wrong while adding the video to playlist"
      );

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isAdded: true,
        },
        "video added to playlist"
      )
    );
  }

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        isAdded: true,
      },
      "video is already added to playlist"
    )
  );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!playlistId || !videoId)
    throw new ApiError(422, "videoId or playlistId is missng");

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    throw new ApiError(422, "Invalid videoId or playlistId");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "video doesn't exists");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(400, "playlist doesn't exists");

  if (playlist.videos.includes(videoId)) {
    const videoDeletedFromPlaylist = await Playlist.findByIdAndUpdate(
      { _id: playlistId },
      {
        $pull: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    );

    if (!videoDeletedFromPlaylist)
      throw new ApiError(
        500,
        "something went wrong while removing the video from playlist"
      );

    return res.status(200).json(
      new ApiResponse(
        201,
        {
          isRemoved: true,
        },
        "video is removed from playlist"
      )
    );
  }

  throw new ApiError(400, "video doesn't exist in the playlist");
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!playlistId) throw new ApiError(422, "playlistId is required");

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user?._id,
  });

  if (!playlist) throw new ApiError(422, "playlist doesn't exists");

  const deletedPlaylist = await Playlist.deleteOne({
    _id: playlistId,
    owner: req.user?._id,
  });

  if (!deletedPlaylist)
    throw new ApiError(500, "something went wrong while updating the playlist");

  return res.status(200).json(
    new ApiResponse(
      201,
      {
        isDeleted: true,
      },
      "playlist deleted successfully"
    )
  );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId) throw new ApiError(422, "playlistId is required");

  if ([name, description].some((field) => field?.trim === ""))
    throw new ApiError(422, "playlist name or description can't be empty");

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user?._id,
  });

  if (!playlist) throw new ApiError(422, "playlist doesn't exists");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist)
    throw new ApiError(500, "something went wrong while updating the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(201, updatedPlaylist, "playlist updated succesfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
