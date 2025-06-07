import React, { createContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  removeFromLocalStorage,
} from "@/lib/localStorageManager";

const AuthContext = createContext(null);
const PROFILES_STORAGE_KEY = "mygpa_profiles";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = useCallback((userId) => {
    const profiles = loadFromLocalStorage(PROFILES_STORAGE_KEY, []);
    return profiles.find((p) => p.id === userId) || null;
  }, []);

  const createUserProfile = useCallback((firebaseUser, additionalData = {}) => {
    const profiles = loadFromLocalStorage(PROFILES_STORAGE_KEY, []);

    const newProfile = {
      id: firebaseUser.uid,
      name: additionalData.name || firebaseUser.displayName || "",
      email: firebaseUser.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: firebaseUser.photoURL || "",
      university_name: "",
      degree_program: "",
      student_id_number: "",
      linkedin_url: "",
      portfolio_url: "",
      ...additionalData,
    };

    profiles.push(newProfile);
    saveToLocalStorage(PROFILES_STORAGE_KEY, profiles);
    return newProfile;
  }, []);

  const updateUserProfile = useCallback((userId, profileData) => {
    const profiles = loadFromLocalStorage(PROFILES_STORAGE_KEY, []);
    const profileIndex = profiles.findIndex((p) => p.id === userId);

    if (profileIndex !== -1) {
      profiles[profileIndex] = {
        ...profiles[profileIndex],
        ...profileData,
        updated_at: new Date().toISOString(),
      };
      saveToLocalStorage(PROFILES_STORAGE_KEY, profiles);
      return profiles[profileIndex];
    }
    return null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        let profile = fetchUserProfile(firebaseUser.uid);

        if (!profile) {
          // Create profile if it doesn't exist
          profile = createUserProfile(firebaseUser);
        } else {
          // Update profile with latest Firebase data
          profile = updateUserProfile(firebaseUser.uid, {
            email: firebaseUser.email,
            avatar_url: firebaseUser.photoURL || profile.avatar_url,
          });
        }

        setUser(profile);
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile, createUserProfile, updateUserProfile]);

  const login = useCallback(
    async (email, password) => {
      try {
        setLoading(true);
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = userCredential.user;

        let profile = fetchUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = createUserProfile(firebaseUser);
        }

        toast({
          title: "Login Successful!",
          description: `Welcome back, ${profile.name || profile.email}!`,
          variant: "default",
        });

        return profile;
      } catch (error) {
        let errorMessage = "Login failed. Please try again.";

        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email.";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password.";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address.";
            break;
          case "auth/user-disabled":
            errorMessage = "This account has been disabled.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many failed attempts. Please try again later.";
            break;
          default:
            errorMessage = error.message;
        }

        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [toast, fetchUserProfile, createUserProfile]
  );

  const signup = useCallback(
    async (name, email, password) => {
      try {
        setLoading(true);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = userCredential.user;

        // Update the user's display name
        await updateProfile(firebaseUser, {
          displayName: name,
        });

        // Create user profile
        const profile = createUserProfile(firebaseUser, { name });

        toast({
          title: "Signup Successful!",
          description: `Welcome, ${name}! Your account has been created.`,
          variant: "default",
        });

        return profile;
      } catch (error) {
        let errorMessage = "Signup failed. Please try again.";

        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "An account with this email already exists.";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address.";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "Email/password accounts are not enabled.";
            break;
          case "auth/weak-password":
            errorMessage =
              "Password is too weak. Please choose a stronger password.";
            break;
          default:
            errorMessage = error.message;
        }

        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [toast, createUserProfile]
  );

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(
    async (email) => {
      try {
        await sendPasswordResetEmail(auth, email);
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for password reset instructions.",
          variant: "default",
        });
      } catch (error) {
        let errorMessage = "Failed to send password reset email.";

        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email address.";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address.";
            break;
          default:
            errorMessage = error.message;
        }

        toast({
          title: "Password Reset Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      }
    },
    [toast]
  );

  const updateUserProfileContext = useCallback(
    async (updatedProfileData) => {
      if (!user) throw new Error("User not authenticated");

      try {
        setLoading(true);
        let profiles = loadFromLocalStorage(PROFILES_STORAGE_KEY, []);
        const profileIndex = profiles.findIndex((p) => p.id === user.id);

        if (profileIndex === -1) {
          toast({
            title: "Profile Update Failed",
            description: "Profile not found.",
            variant: "destructive",
          });
          setLoading(false);
          throw new Error("Profile not found.");
        }

        const updatedProfile = {
          ...profiles[profileIndex],
          ...updatedProfileData,
          updated_at: new Date().toISOString(),
        };

        profiles[profileIndex] = updatedProfile;
        saveToLocalStorage(PROFILES_STORAGE_KEY, profiles);
        setUser(updatedProfile);

        // Update Firebase profile if name is being changed
        if (updatedProfileData.name && auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: updatedProfileData.name,
          });
        }

        toast({
          title: "Profile Updated",
          description: "Your profile has been updated.",
        });

        return updatedProfile;
      } catch (error) {
        toast({
          title: "Profile Update Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    isAuthenticated: !!user,
    updateUserProfileContext,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
