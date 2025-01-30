import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Appwrite SDK
import { ID } from "react-native-appwrite";
import { AppwriteClientFactory } from "./appwrite-client";

// Platform-specific Appwrite SDK Client
const storage = AppwriteClientFactory.getInstance().storage;

export default function App() {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  /**
   *
   * @param asset
   * @returns
   */
  const prepareNativeFile = async (
    asset: ImagePicker.ImagePickerAsset
  ): Promise<{ name: string; type: string; size: number; uri: string }> => {
    console.log("[prepareNativeFile] asset ==>", asset);
    try {
      const url = new URL(asset.uri);

      // Handle native file preparation
      return {
        name: url.pathname.split("/").pop()!,
        size: asset.fileSize!,
        type: asset.mimeType!,
        uri: url.href,
      } as any;
    } catch (error) {
      console.error("[prepareNativeFile] error ==>", error);
      return Promise.reject(error);
    }
  };

  /**
   * Uploads an image to Appwrite storage
   * @param {ImagePicker.ImagePickerAsset} asset - The image asset to upload
   * @returns {Promise<URL>} The URL of the uploaded file
   * @throws {Error} When upload fails
   */
  async function uploadImageAsync(asset: ImagePicker.ImagePickerAsset) {
    try {
      const response = await storage.createFile(
        process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!,
        ID.unique(),
        // @ts-ignore
        Platform.OS === "web" ? asset.file! : await prepareNativeFile(asset)
      );
      console.log("[file uploaded] ==>", response);

      const fileUrl = storage.getFileView(
        process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!, // bucketId
        response.$id // fileId
      );

      console.log("[file url] ==>", fileUrl);

      return fileUrl;
    } catch (error) {
      console.error("[uploadImageAsync] error ==>", error);
      return Promise.reject(error);
    }
  }

  /**
   * Launches the device image picker
   * @returns {Promise<void>}
   */
  const pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    console.log({ pickerResult });

    handleImagePicked(pickerResult);
  };

  /**
   * Handles the image picked from the device
   * @param {ImagePicker.ImagePickerResult} pickerResult - The result from image picker
   * @returns {Promise<void>}
   */
  const handleImagePicked = async (
    pickerResult: ImagePicker.ImagePickerResult
  ) => {
    try {
      if (!pickerResult.canceled) {
        await uploadImageAsync(pickerResult.assets[0]);
        alert("Upload successful! 🎉");
      }
    } catch (e) {
      console.log(e);
      alert("Upload failed, sorry :(");
    } finally {
    }
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
      <Button onPress={pickImage} title="Pick an image from camera roll" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
