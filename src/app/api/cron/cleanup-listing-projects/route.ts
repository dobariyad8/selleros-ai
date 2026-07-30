import {
  NextRequest,
  NextResponse,
} from "next/server";

import { serverEnv } from "@/lib/env/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const LISTING_IMAGE_BUCKET =
  "listing-project-images";

const CLEANUP_BATCH_SIZE = 50;

type ExpiredProject = {
  id: string;
  etsy_user_id: string;
};

function isAuthorized(
  request: NextRequest,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (!authorization) {
    return false;
  }

  const [scheme, token] =
    authorization.split(" ");

  return (
    scheme?.toLowerCase() ===
      "bearer" &&
    token === serverEnv.cronSecret
  );
}

export async function POST(
  request: NextRequest,
) {
  const startedAt = new Date();

  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const {
      data: expiredProjects,
      error: projectsError,
    } = await supabaseAdmin
      .from("listing_projects")
      .select(
        "id, etsy_user_id",
      )
      .lte(
        "expires_at",
        new Date().toISOString(),
      )
      .order("expires_at", {
        ascending: true,
      })
      .limit(CLEANUP_BATCH_SIZE)
      .returns<ExpiredProject[]>();

    if (projectsError) {
      console.error(
        "Expired listing projects lookup failed:",
        projectsError,
      );

      throw new Error(
        "Expired listing projects could not be loaded.",
      );
    }

    const results: {
      projectId: string;
      success: boolean;
      deletedFiles: number;
      error?: string;
    }[] = [];

    for (
      const project of
        expiredProjects ?? []
    ) {
      try {
        const {
          data: imageRecords,
          error: imagesError,
        } = await supabaseAdmin
          .from(
            "listing_project_images",
          )
          .select("storage_path")
          .eq(
            "project_id",
            project.id,
          )
          .eq(
            "etsy_user_id",
            project.etsy_user_id,
          );

        if (imagesError) {
          throw new Error(
            "Project image records could not be loaded.",
          );
        }

        const storagePaths =
          (imageRecords ?? [])
            .map(
              (image) =>
                image.storage_path,
            )
            .filter(
              (
                storagePath,
              ): storagePath is string =>
                typeof storagePath ===
                  "string" &&
                storagePath.length > 0,
            );

        if (
          storagePaths.length > 0
        ) {
          const {
            error:
              storageDeleteError,
          } =
            await supabaseAdmin.storage
              .from(
                LISTING_IMAGE_BUCKET,
              )
              .remove(
                storagePaths,
              );

          if (
            storageDeleteError
          ) {
            throw new Error(
              "Project image files could not be deleted.",
            );
          }
        }

        const {
          error:
            projectDeleteError,
        } = await supabaseAdmin
          .from(
            "listing_projects",
          )
          .delete()
          .eq(
            "id",
            project.id,
          )
          .eq(
            "etsy_user_id",
            project.etsy_user_id,
          );

        if (
          projectDeleteError
        ) {
          throw new Error(
            "Project record could not be deleted.",
          );
        }

        results.push({
          projectId:
            project.id,
          success: true,
          deletedFiles:
            storagePaths.length,
        });
      } catch (
        projectCleanupError
      ) {
        const message =
          projectCleanupError instanceof
          Error
            ? projectCleanupError.message
            : "Project cleanup failed.";

        console.error(
          `Expired project cleanup failed for ${project.id}:`,
          projectCleanupError,
        );

        results.push({
          projectId:
            project.id,
          success: false,
          deletedFiles: 0,
          error: message,
        });
      }
    }

    const successfulProjects =
      results.filter(
        (result) =>
          result.success,
      ).length;

    const failedProjects =
      results.length -
      successfulProjects;

    const deletedFiles =
      results.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.deletedFiles,
        0,
      );

    return NextResponse.json({
      success:
        failedProjects === 0,
      processedProjects:
        results.length,
      deletedProjects:
        successfulProjects,
      failedProjects,
      deletedFiles,
      batchLimit:
        CLEANUP_BATCH_SIZE,
      startedAt:
        startedAt.toISOString(),
      finishedAt:
        new Date().toISOString(),
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Expired listing projects could not be cleaned up.";

    console.error(
      "Listing project cleanup failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: message,
        startedAt:
          startedAt.toISOString(),
        finishedAt:
          new Date().toISOString(),
      },
      {
        status: 500,
      },
    );
  }
}