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
      height: calc(70vh - 98px); min-height: 420px; max-height: 680px;
      margin-top: 98px;
    }
    @media (min-width: 1400px) {
      .featurediframe { height: calc(72vh - 98px); max-height: 760px; }
    }
    @media (min-width: 1920px) {
      .featurediframe { height: calc(68vh - 98px); max-height: 860px; }
    }
    @media (max-width: 1024px) and (orientation: portrait) {
      .featurediframe { height: calc(90vh - 82px); min-height: 320px; max-height: 720px; margin-top: 82px; }
    }
    @media (max-width: 1024px) and (orientation: landscape) {
      .featurediframe { height: calc(100vh - 82px); min-height: 280px; max-height: 420px; margin-top: 82px; }
    }
    @media (max-width: 600px) and (orientation: portrait) {
      .featurediframe { height: calc(90vh - 76px); min-height: 260px; max-height: 720px; margin-top: 76px; }
    }
    @media (max-width: 900px) and (orientation: landscape) and (max-height: 500px) {
      .featurediframe { height: calc(100vh - 76px); min-height: 200px; margin-top: 76px; }
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
