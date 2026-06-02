"use strict";
(self.webpackChunk = self.webpackChunk || []).push([[8372], {
  5939: function (a, e, t) {
    t.r(e);
    e.default = `
<div id="indexPage" style="outline:0;padding:0!important" data-role="page" data-dom-cache="true"
  class="page homePage libraryPage allLibraryPage backdropPage pageWithAbsoluteTabs withTabs"
  data-backdroptype="movie,series,book">

  <style>
    .featurediframe {
      width: 100%; display: block; border: 0; margin: 0; padding: 0;
      height: 82vh; min-height: 640px; max-height: 900px;
      margin-top: 0;
    }
    @media (min-width: 1400px) {
      .featurediframe { height: 84vh; max-height: 960px; }
    }
    @media (min-width: 1920px) {
      .featurediframe { height: 86vh; max-height: 1040px; }
    }
    @media (max-width: 1024px) and (orientation: portrait) {
      .featurediframe { height: 82vh; min-height: 560px; max-height: 840px; margin-top: 0; }
    }
    @media (max-width: 1024px) and (orientation: landscape) {
      .featurediframe { height: 92vh; min-height: 380px; max-height: 620px; margin-top: 0; }
    }
    @media (max-width: 600px) and (orientation: portrait) {
      .featurediframe { height: 80vh; min-height: 500px; max-height: 800px; margin-top: 0; }
    }
    @media (max-width: 900px) and (orientation: landscape) and (max-height: 500px) {
      .featurediframe { height: 92vh; min-height: 340px; max-height: 560px; margin-top: 0; }
    }
  </style>

  <div class="tabContent pageTabContent" id="homeTab" data-index="0">
    <iframe class="featurediframe" src="/web/ui/spotlight.html"></iframe>
    <div class="sections"></div>
  </div>

  <div class="tabContent pageTabContent" id="favoritesTab" data-index="1">
    <div class="sections"></div>
  </div>

</div>`;
  }
}]);

// Force dark theme
(function () {
  Object.keys(localStorage)
    .filter(k => k.endsWith('-appTheme'))
    .forEach(k => localStorage.setItem(k, 'dark'));

  const _setItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    if (key.endsWith('-appTheme')) value = 'dark';
    _setItem(key, value);
  };
})();

document.addEventListener("DOMContentLoaded", () => {

  const homeTab = document.getElementById("homeTab");
  if (!homeTab) return;

  const iframe = homeTab.querySelector(".featurediframe");
  if (!iframe) return;

  new MutationObserver(() => {
    iframe.style.display = homeTab.classList.contains("is-active") ? "block" : "none";
  }).observe(homeTab, { attributes: true, attributeFilter: ["class"] });
});
