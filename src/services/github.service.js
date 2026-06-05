import axios from "axios";

export const getRepoDetails =
  async (repoUrl) => {

    // remove .git
    repoUrl =
      repoUrl.replace(
        ".git",
        ""
      );

    // split url
    const parts =
      repoUrl.split("/");

    // get owner + repo
    const owner =
      parts[3];

    const repo =
      parts[4];

    const response =
      await axios.get(

        `https://api.github.com/repos/${owner}/${repo}`

      );

    return response.data;

};