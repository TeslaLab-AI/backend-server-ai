import simpleGit from "simple-git";
import fs from "fs";

const git = simpleGit();

export const cloneRepository =
  async (repoUrl, repoName) => {

    try {
      if (!repoUrl || !repoName) {
        throw new Error("Missing repository URL or target path");
      }

      const repoPath =
        repoName.includes("/") ||
        repoName.includes("\\")
          ? repoName
          : `repos/${repoName}`;

      // repo already exists
      if (
        fs.existsSync(repoPath)
      ) {

        console.log(
          "Repo already exists"
        );

        return repoPath;

      }

      await git.clone(
        repoUrl,
        repoPath
      );

      console.log(
        "Repo cloned"
      );

      return repoPath;

    } catch (error) {

      console.log(error);

      throw new Error(
        "Repository clone failed"
      );

    }

};