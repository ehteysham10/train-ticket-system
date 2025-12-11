
// controllers/chatController.js
import ChatMessage from "../models/ChatMessage.js";
import mongoose from "mongoose";

/**
 * GET /api/chat/history/:userId?cursor=<messageId>&limit=10
 * Simple + Safe Cursor Pagination (using ObjectId)
 */
export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor; // messageId (ObjectId)

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    // Logged-in user (admin or normal user)
    const me = req.user?.id || req.user?._id || req.user || null;

    if (!me) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Base match query (chat between 2 users)
    const baseQuery = {
      $or: [
        { sender: userId, receiver: me.toString() },
        { sender: me.toString(), receiver: userId }
      ]
    };

    // Cursor exists → load older messages
    if (cursor) {
      baseQuery._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    // Fetch messages sorted by newest first (fastest with ObjectId)
    const messages = await ChatMessage.find(baseQuery)
      .sort({ _id: -1 })
      .limit(limit + 1) // fetch one extra → tells us hasMore
      .lean();

    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop(); // remove extra fetched element
    }

    // Reverse to oldest → newest for UI
    const ordered = messages.reverse();

    // Cursor for next page = oldest message in this batch
    const nextCursor = ordered.length > 0 ? ordered[0]._id : null;

    return res.json({
      success: true,
      messages: ordered,
      nextCursor,
      hasMore,
    });

  } catch (err) {
    console.error("getChatHistory error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * GET /api/chat/users
 * Returns list of user threads
 * (unchanged from your original — safe)
 */
export const getChatUsers = async (req, res) => {
  try {
    const adminId = req.user?.id || req.user?._id || "admin"; // fallback

    const pipeline = [
      {
        $match: {
          $or: [{ sender: adminId.toString() }, { receiver: adminId.toString() }],
        },
      },
      {
        $project: {
          sender: 1,
          receiver: 1,
          message: 1,
          isAdmin: 1,
          createdAt: 1,
          other: {
            $cond: [{ $eq: ["$sender", adminId.toString()] }, "$receiver", "$sender"],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$other",
          lastMessage: { $first: "$message" },
          lastAt: { $first: "$createdAt" },
          lastIsAdmin: { $first: "$isAdmin" },
        },
      },
      {
        $project: {
          userId: "$_id",
          lastMessage: 1,
          lastAt: 1,
          lastIsAdmin: 1,
        },
      },
      { $sort: { lastAt: -1 } },
    ];

    const rows = await ChatMessage.aggregate(pipeline);

    const result = rows.map((r) => ({
      userId: r.userId,
      lastMessage: r.lastMessage,
      lastAt: r.lastAt
    }));

    res.json({ success: true, users: result });
  } catch (err) {
    console.error("getChatUsers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
