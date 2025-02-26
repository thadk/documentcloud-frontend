<script>
  import Link from "@/router/Link";
  import Image from "@/common/Image";
  import Loader from "@/common/Loader";
  import Tooltip from "@/common/Tooltip";
  import emitter from "@/emit";
  import { documents } from "@/manager/documents";
  import { _ } from "svelte-i18n";

  // SVG assets
  import errorIconSvg from "@/assets/error_icon.svg";

  export let document;
  export let embed = false;
  export let dialog = false;

  const emit = emitter({
    pick() {},
  });

  $: realProgress =
    document == null ? null : $documents.realProgressMap[document.id];
  $: pagesProcessed =
    document == null ? null : $documents.pagesProcessedMap[document.id];
  $: pageCount = document == null ? null : $documents.pageCountMap[document.id];
</script>

<style lang="scss">
  .img {
    padding: 0 35px 20px 35px;
    display: table-cell;
    vertical-align: top;

    @media only screen and (max-width: $mobileBreak) {
      padding: 10px 15px 20px 15px;
    }

    :global(img),
    > *,
    .fullstatus {
      width: 70px;
      height: 88px;
      display: table-cell;
      text-align: center;
      vertical-align: middle;
      object-fit: contain;

      @media only screen and (max-width: $mobileBreak) {
        width: 43px;
        height: 54px;
        font-size: 12px;
      }
    }

    &.embed {
      padding: 5px 15px 10px 15px;

      :global(img),
      > *,
      .fullstatus {
        width: 43px;
        height: 54px;
        font-size: 12px;
      }
    }

    .error {
      background: #fffafa;
    }

    .imgwrap {
      background: white;
      outline: $normaloutline;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.12);
    }

    .caption {
      text-align: left;

      p {
        margin: 5px 0;
      }
    }
  }
</style>

<div class="img" data-id={document.id} class:embed>
  <span class="imgwrap">
    {#if document.viewable}
      {#if dialog}
        <Image
          clickable={true}
          on:click={() => emit.pick(document)}
          src={document.thumbnail}
        />
      {:else if embed && document.publishedUrl != null && document.publishedUrl.trim().length > 0}
        <a href={document.publishedUrl} rel="noreferrer" target="_blank"
          ><Image src={document.thumbnail} /></a
        >
      {:else}
        <Link newPage={embed} to="viewer" params={{ id: document.slugId }}>
          <Image src={document.thumbnail} />
        </Link>
      {/if}
    {:else if document.pending}
      <Tooltip>
        <div slot="caption" class="caption">
          {#if realProgress != null}
            <p>{Math.floor(realProgress * 100)}%</p>
            {#if pagesProcessed != null}
              <p>
                {pagesProcessed} / {pageCount}
                {$_("documentThumbnail.pages")}
              </p>
            {/if}
          {:else}{$_("documentThumbnail.loading")}{/if}
        </div>
        <Loader active={true} center={true} big={true}>
          <span class="fullstatus">{document.status}</span>
        </Loader>
      </Tooltip>
    {:else}
      <span class="error">
        {@html errorIconSvg}
      </span>
    {/if}
  </span>
</div>
