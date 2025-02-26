<script>
  import TextPage from "@/common/TextPage";
  import session from "@/api/session";
  import { tick } from "svelte";
  import { jsonUrl } from "@/api/viewer";
  import { doc } from "@/viewer/document";
  import { layout } from "@/viewer/layout";
  import { viewer } from "@/viewer/viewer";
  import { showIfFullyVisible } from "@/util/visibility";
  import { _ } from "svelte-i18n";

  let textDoc = null;
  let loading = false;
  let docElem;
  export let scrollParams;
  $: pages = textDoc == null ? [] : textDoc.pages;

  $: {
    if ($viewer.document != null && textDoc == null && !loading) {
      loading = true;
      (async () => {
        textDoc = await session.getStatic(jsonUrl(viewer.document));
        loading = false;
        await tick();
        doc.jumpToTextJump();
      })();
    }
  }

  $: topPage = getTopPage(scrollParams);
  $: doc.visiblePageNumber = topPage + 1;

  function getTopPage(scrollParams) {
    if (docElem == null) return 0;

    for (let i = 0; i < docElem.children.length; i++) {
      if (
        docElem.children[i].offsetTop + docElem.children[i].offsetHeight >
        scrollParams.scrollTop
      ) {
        return i;
      }
    }
    return docElem.children.length - 1;
  }
</script>

<style lang="scss">
  .doc {
    margin-bottom: 30px;

    .page {
      max-width: 1200px;
      width: 100%;
      margin: 20px auto;
      position: relative;

      .numbercontainer {
        position: absolute;
        top: 0;
        right: 100%;
        height: 100%;
        user-select: none;

        .number {
          position: sticky;
          text-align: right;
          box-sizing: border-box;
          padding: 12px 20px 12px 0;
          font-weight: bold;
          font-size: 12px;
          white-space: pre;
          top: 20px;

          a {
            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }
</style>

<div class="doc" bind:this={docElem}>
  {#each pages as page, i}
    <div class="page">
      <div class="numbercontainer">
        <div id={i + 1} class="number" use:showIfFullyVisible>
          <a href={`#${i + 1}`}>{$_("document.pageAbbrev")}&nbsp;{i + 1}</a>
        </div>
      </div>
      <TextPage
        text={page.contents}
        highlights={$layout.searchHighlights != null
          ? $layout.searchHighlights[i]
          : null}
      />
    </div>
  {/each}
</div>
