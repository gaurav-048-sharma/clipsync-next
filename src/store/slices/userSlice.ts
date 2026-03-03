import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// Async thunks
export const fetchOwnProfile = createAsyncThunk(
  'user/fetchOwnProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/users/me', getAuthHeaders());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/users/${username}`, getAuthHeaders());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/users/me', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'user/fetchFollowers',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/users/followers/${username}`, getAuthHeaders());
      return response.data.followers;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch followers');
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'user/fetchFollowing',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/users/following/${username}`, getAuthHeaders());
      return response.data.following;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch following');
    }
  }
);

export const followUser = createAsyncThunk(
  'user/followUser',
  async (username: string, { rejectWithValue }) => {
    try {
      await axios.post(`/api/users/follow/${username}`, {}, getAuthHeaders());
      return username;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'user/unfollowUser',
  async (username: string, { rejectWithValue }) => {
    try {
      await axios.post(`/api/users/unfollow/${username}`, {}, getAuthHeaders());
      return username;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfollow user');
    }
  }
);

interface UserState {
  profile: any | null;
  viewedProfile: any | null;
  followers: any[];
  following: any[];
  isLoading: boolean;
  error: string | null;
  followLoading: boolean;
}

const initialState: UserState = {
  profile: null,
  viewedProfile: null,
  followers: [],
  following: [],
  isLoading: false,
  error: null,
  followLoading: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearViewedProfile: (state) => {
      state.viewedProfile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Own Profile
      .addCase(fetchOwnProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOwnProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchOwnProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.viewedProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Followers
      .addCase(fetchFollowers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.followers = action.payload;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Following
      .addCase(fetchFollowing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.isLoading = false;
        state.following = action.payload;
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Follow User
      .addCase(followUser.pending, (state) => {
        state.followLoading = true;
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state) => {
        state.followLoading = false;
      })
      .addCase(followUser.rejected, (state, action) => {
        state.followLoading = false;
        state.error = action.payload as string;
      })
      // Unfollow User
      .addCase(unfollowUser.pending, (state) => {
        state.followLoading = true;
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state) => {
        state.followLoading = false;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.followLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserError, clearViewedProfile } = userSlice.actions;
export default userSlice.reducer;
