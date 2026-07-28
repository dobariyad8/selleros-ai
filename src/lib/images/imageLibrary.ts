export type SavedAiImage = {
  id: string;
  listingId: string;
  listingTitle: string;
  imageBlob: Blob;
  mimeType: string;
  style: string;
  styleLabel: string;
  customInstructions: string;
  sourceImageUrl: string;
  createdAt: string;
};

const DATABASE_NAME = "selleros-ai";
const DATABASE_VERSION = 1;
const IMAGE_STORE_NAME = "generated-images";

function openImageDatabase() {
  return new Promise<IDBDatabase>(
    (resolve, reject) => {
      if (typeof window === "undefined") {
        reject(
          new Error(
            "The image library is only available in the browser.",
          ),
        );

        return;
      }

      const request = indexedDB.open(
        DATABASE_NAME,
        DATABASE_VERSION,
      );

      request.onupgradeneeded = () => {
        const database = request.result;

        if (
          !database.objectStoreNames.contains(
            IMAGE_STORE_NAME,
          )
        ) {
          const store =
            database.createObjectStore(
              IMAGE_STORE_NAME,
              {
                keyPath: "id",
              },
            );

          store.createIndex(
            "listingId",
            "listingId",
            {
              unique: false,
            },
          );

          store.createIndex(
            "createdAt",
            "createdAt",
            {
              unique: false,
            },
          );
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "The image library could not be opened.",
            ),
        );
      };
    },
  );
}

export async function saveAiImage(
  image: SavedAiImage,
) {
  const database =
    await openImageDatabase();

  return new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          IMAGE_STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          IMAGE_STORE_NAME,
        );

      store.put(image);

      transaction.oncomplete = () => {
        database.close();
        resolve();
      };

      transaction.onerror = () => {
        database.close();

        reject(
          transaction.error ??
            new Error(
              "The generated image could not be saved.",
            ),
        );
      };

      transaction.onabort = () => {
        database.close();

        reject(
          transaction.error ??
            new Error(
              "Saving the generated image was cancelled.",
            ),
        );
      };
    },
  );
}

export async function getSavedAiImages() {
  const database =
    await openImageDatabase();

  return new Promise<SavedAiImage[]>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          IMAGE_STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          IMAGE_STORE_NAME,
        );

      const request = store.getAll();

      request.onsuccess = () => {
        const images = (
          request.result as SavedAiImage[]
        ).sort(
          (first, second) =>
            new Date(
              second.createdAt,
            ).getTime() -
            new Date(
              first.createdAt,
            ).getTime(),
        );

        resolve(images);
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Saved images could not be loaded.",
            ),
        );
      };

      transaction.oncomplete = () => {
        database.close();
      };
    },
  );
}

export async function deleteSavedAiImage(
  id: string,
) {
  const database =
    await openImageDatabase();

  return new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          IMAGE_STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          IMAGE_STORE_NAME,
        );

      store.delete(id);

      transaction.oncomplete = () => {
        database.close();
        resolve();
      };

      transaction.onerror = () => {
        database.close();

        reject(
          transaction.error ??
            new Error(
              "The saved image could not be deleted.",
            ),
        );
      };
    },
  );
}

export function dataUrlToBlob(
  dataUrl: string,
) {
  const [metadata, encodedData] =
    dataUrl.split(",");

  if (!metadata || !encodedData) {
    throw new Error(
      "The generated image data is invalid.",
    );
  }

  const mimeTypeMatch =
    metadata.match(
      /^data:(.+);base64$/,
    );

  const mimeType =
    mimeTypeMatch?.[1] ?? "image/png";

  const binaryString =
    window.atob(encodedData);

  const bytes =
    new Uint8Array(
      binaryString.length,
    );

  for (
    let index = 0;
    index < binaryString.length;
    index += 1
  ) {
    bytes[index] =
      binaryString.charCodeAt(index);
  }

  return new Blob([bytes], {
    type: mimeType,
  });
}