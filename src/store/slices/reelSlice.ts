import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// Async thunks
export const fetchUserReels = createAsyncThunk(
  'reel/fetchUserReels',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/reels/user/${username}`, getAuthHeaders());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reels');
    }
  }
);

export const uploadReel = createAsyncThunk(
  'reel/uploadReel',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/reels', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload reel');
    }
  }
);

export const likeReel = createAsyncThunk(
  'reel/likeReel',
  async (reelId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/reels/${reelId}/like`, {}, getAuthHeaders());
      return { reelId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like reel');
    }
  }
);

export const commentOnReel = createAsyncThunk(
  'reel/commentOnReel',
  async ({ reelId, text }: { reelId: string; text: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/api/reels/${reelId}/comment`,
        { text },
        getAuthHeaders()
      );
      return { reelId, comment: response.data.comment };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to comment on reel');
    }
  }
);

interface ReelState {
  reels: any[];
  currentReel: any | null;
  isLoading: boolean;
  uploadLoading: boolean;
  error: string | null;
}

const initialState: ReelState = {
  reels: [],
  currentReel: null,
  isLoading: false,
  uploadLoading: false,
  error: null,
};

const reelSlice = createSlice({
  name: 'reel',
  initialState,
  reducers: {
    clearReelError: (state) => {
      state.error = null;
    },
    setCurrentReel: (state, action: PayloadAction<any>) => {
      state.currentReel = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Reels
      .addCase(fetchUserReels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserReels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reels = action.payload;
      })
      .addCase(fetchUserReels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Upload Reel
      .addCase(uploadReel.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadReel.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.reels.unshift(action.payload);
      })
      .addCase(uploadReel.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload as string;
      })
      // Like Reel
      .addCase(likeReel.fulfilled, (state, action) => {
        const reel = state.reels.find((r) => r._id === action.payload.reelId);
        if (reel) {
          reel.liked = true;
        }
      })
      // Comment on Reel
      .addCase(commentOnReel.fulfilled, (state, action) => {
        const reel = state.reels.find((r) => r._id === action.payload.reelId);
        if (reel && reel.comments) {
          reel.comments.push(action.payload.comment);
        }
      });
  },
});

export const { clearReelError, setCurrentReel } = reelSlice.actions;
export default reelSlice.reducer;
