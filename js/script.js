document.addEventListener("DOMContentLoaded", () => {
  const contentContainer = document.getElementById("content-container");
  const loadingSpinner = document.querySelector(".loading");
  const loadMoreButton = document.getElementById("load-more");
  let currentMode = "portfolio";
  let loadedPosts = 0;
  const postLimit = 5;
  let allPosts = [];

  function showLoading() {
    loadingSpinner.classList.add("show");
  }

  function hideLoading() {
    loadingSpinner.classList.remove("show");
  }

  function createContentItem(title, description, link, stars, forks) {
    const item = document.createElement("div");
    item.classList.add("content-item");
    item.innerHTML = `
            <h2>${title}</h2>
            <p>${description}</p>
            ${
              stars !== undefined
                ? `<p>Stars: ${stars} | Forks: ${forks}</p>`
                : ""
            }
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="view-more">View More</a>
        `;
    return item;
  }

  async function loadContent(type, all = false) {
    showLoading();
    contentContainer.innerHTML = "";
    loadedPosts = 0;
    allPosts = [];

    loadMoreButton.style.display = "none";

    switch (type) {
      case "portfolio":
        contentContainer.appendChild(
          createContentItem(
            "My Portfolio",
            "Explore my portfolio",
            "https://bhanukafernando.gitlab.io"
          )
        );
        contentContainer.appendChild(
          createContentItem(
            "My Chronicle",
            "Discover my chronicle",
            "https://0x5un5h1n3.gitlab.io/blog"
          )
        );
        break;
      case "github":
        try {
          const response = await fetch(
            "https://api.github.com/users/0x5un5h1n3/repos"
          );
          const repos = await response.json();
          allPosts = repos;
          let reposToShow = all
            ? allPosts
            : allPosts
                .filter(
                  (repo) => repo.stargazers_count > 0 || repo.forks_count > 0
                )
                .slice(0, postLimit);
          reposToShow.forEach((repo) => {
            contentContainer.appendChild(
              createContentItem(
                repo.name,
                repo.description || "No description available",
                repo.html_url,
                repo.stargazers_count,
                repo.forks_count
              )
            );
          });
          loadedPosts = reposToShow.length;

          if (allPosts.length > postLimit) {
            loadMoreButton.style.display = "block";
          } else {
            loadMoreButton.style.display = "none";
          }
        } catch (error) {
          console.error("Error fetching GitHub repos:", error);
          contentContainer.appendChild(
            createContentItem("Error", "Failed to load GitHub projects", "#")
          );
        }
        break;
      case "social":
        contentContainer.appendChild(
          createContentItem(
            "Mastodon",
            "Follow me on Mastodon",
            "https://mastodon.social/@0x5un5h1n3"
          )
        );
        contentContainer.appendChild(
          createContentItem(
            "GitHub",
            "Check out my GitHub profile",
            "https://github.com/0x5un5h1n3"
          )
        );
        contentContainer.appendChild(
          createContentItem(
            "Keyoxide",
            "Verify my identity",
            "https://keyoxide.org/hkp/E7722010D9E1010C9C2C4054820C9C02C1229C58"
          )
        );
        break;
      case "about":
        contentContainer.innerHTML = `
          <h2>About</h2>
          <p>This is the about page.</p>
        `;
        break;
    }

    hideLoading();
  }

  document.getElementById("portfolio-btn").addEventListener("click", () => {
    loadContent("portfolio");
    setActiveButton("portfolio-btn");
    document
      .querySelector(".buttons-container")
      .classList.remove("github-section");
    loadMoreButton.style.display = "none";
    currentMode = "portfolio";
  });

  document.getElementById("github-btn").addEventListener("click", () => {
    loadContent("github", false);
    setActiveButton("github-btn");
    document
      .querySelector(".buttons-container")
      .classList.add("github-section");
    currentMode = "github";
  });

  document.getElementById("social-btn").addEventListener("click", () => {
    loadContent("social");
    setActiveButton("social-btn");
    document
      .querySelector(".buttons-container")
      .classList.remove("github-section");
    loadMoreButton.style.display = "none";
    currentMode = "social";
  });

  document.getElementById("about-btn").addEventListener("click", () => {
    // Show the about modal instead of navigating to a new page
    const modal = document.getElementById("about-modal");
    modal.style.display = "block";
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);
  });

  function setActiveButton(buttonId) {
    const buttons = document.querySelectorAll(".nav-buttons button");
    buttons.forEach((button) => button.classList.remove("active"));
    document.getElementById(buttonId).classList.add("active");
  }

  loadMoreButton.addEventListener("click", () => {
    if (currentMode === "github" && loadedPosts < allPosts.length) {
      const nextPosts = allPosts.slice(loadedPosts, loadedPosts + postLimit);
      nextPosts.forEach((repo) => {
        contentContainer.appendChild(
          createContentItem(
            repo.name,
            repo.description || "No description available",
            repo.html_url,
            repo.stargazers_count,
            repo.forks_count
          )
        );
      });
      loadedPosts += nextPosts.length;
      if (loadedPosts >= allPosts.length) {
        loadMoreButton.style.display = "none";
      }
    }
  });

  // About modal functionality
  const modal = document.getElementById("about-modal");
  const span = document.getElementsByClassName("close")[0];

  span.onclick = function () {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    }
  };

  // Ripple effect
  contentContainer.addEventListener("click", function (e) {
    if (e.target.closest(".content-item")) {
      const item = e.target.closest(".content-item");
      const ripple = document.createElement("div");
      ripple.classList.add("ripple");
      const rect = item.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      item.appendChild(ripple);
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  });

  // Update the current year in the footer
  const currentYear = new Date().getFullYear();
  document.getElementById("current-year").textContent = currentYear;

  // Load portfolio content by default
  loadContent("portfolio");
  setActiveButton("portfolio-btn");
});
