<script>
  import { onMount } from "svelte";
  import { router } from "@/router/router";
  import { getDocument } from "@/api/document";
  import { extractEntities } from "@/api/entity";
  import { jsonUrl } from "@/api/viewer";
  import session from "@/api/session";
  import { handlePlural } from "@/util/string";
  import Link from "@/router/Link";
  import { entities, getE } from "@/entities/entities";
  import { updateInCollection } from "@/manager/documents";
  import Progress from "@/common/Progress";
  import { _ } from "svelte-i18n";

  import closeSvg from "@/assets/close_inline.svg";

  const CONTACT = process.env.SPECIAL_CONTACT;

  let loading = true;
  let fullText = null;
  let selectedEntity = null;
  let page = 1;
  let extractionError = false;
  let extractionStage = 0;
  let kindFilter = {
    person: true,
    organization: true,
    location: true,
    event: true,
    work_of_art: true,
    consumer_good: true,
    address: true,
    date: true,
    number: true,
    phone_number: true,
    price: true,
    unknown: true,
    other: true,
  };
  let occurrenceFilter = {
    proper: true,
    common: true,
    unknown: true,
  };
  let advancedFilter = {
    relevance: 0,
  };

  function filterize(f) {
    const results = [];
    for (const k in f) {
      if (f.hasOwnProperty(k)) {
        if (f[k]) {
          results.push(`${k}`);
        }
      }
    }
    return results.join(",");
  }

  $: filter = {
    kind: filterize(kindFilter),
    occurrences: filterize(occurrenceFilter),
    relevance__gt: advancedFilter.relevance,
    mid: advancedFilter.mid,
    wikipedia_url: advancedFilter.wikipedia_url,
  };

  const SNIPPET_LENGTH = 100;

  async function extract() {
    if (entities.document == null) return;
    const id = entities.document.id;
    try {
      extractionStage = 1;
      await extractEntities(id);
      entities.document.doc = { ...entities.document.doc, status: "readable" };
      entities.document = entities.document;
      updateInCollection(
        entities.document,
        (d) => (d.doc = { ...d.doc, status: "readable" }),
      );
      extractionStage = 2;
    } catch (e) {
      extractionError = true;
      console.error(e);
      alert(`An unexpected error occurred: ${JSON.stringify(e)}`);
    }
  }

  function getSnippet(occurrence) {
    const pageText = fullText.pages[occurrence.page].contents;
    return [
      pageText.substring(
        occurrence.page_offset - SNIPPET_LENGTH / 2,
        occurrence.page_offset,
      ),
      pageText.substring(
        occurrence.page_offset,
        occurrence.page_offset + occurrence.content.length,
      ),
      pageText.substring(
        occurrence.page_offset + occurrence.content.length,
        occurrence.page_offset + occurrence.content.length + SNIPPET_LENGTH / 2,
      ),
    ];
  }

  onMount(async () => {
    const id = parseInt(router.resolvedRoute.props.id.split("-")[0]);
    entities.document = await getDocument(id);
    try {
      entities.entities = await getE(id, 1);
      fullText = await session.getStatic(jsonUrl(entities.document));
    } catch (e) {
      console.error(e);
    }
    loading = false;
  });

  let pagePushed = false;

  async function pushPage(num) {
    pagePushed = true;
    page = num;
    const id = parseInt(router.resolvedRoute.props.id.split("-")[0]);
    selectedEntity = null;
    entities.entities = await getE(id, page, filter);
  }

  async function applyFilters() {
    await pushPage(page);
  }

  async function prevPage() {
    pushPage(page - 1);
  }

  async function nextPage() {
    pushPage(page + 1);
  }

  function categorizeEntities(entities) {
    if (entities == null) return {};
    const results = {};
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (results[entity.kind] == null) results[entity.kind] = [];
      results[entity.kind].push(entity);
    }
    return results;
  }

  $: entitiesByCategory = categorizeEntities(
    ($entities.entities || {}).entities,
  );
  $: categories =
    entitiesByCategory == null ? [] : Object.keys(entitiesByCategory).sort();
</script>

<style lang="scss">
  p {
    max-width: 33em;
  }

  a {
    color: $primary;
  }

  .highlight {
    background: rgb(250, 244, 208);
  }

  .body {
    margin: 20px;
  }

  .categories {
    margin: 0 -10px;
  }

  .category {
    border: solid 1px gainsboro;
    margin: 10px;
    display: inline-block;
    vertical-align: top;

    .categorytitle {
      font-weight: bold;
      padding: 6px 10px;
    }

    .entity {
      padding: 6px 10px;
      cursor: pointer;

      .subtitle {
        color: $gray;
        font-weight: 12px;
      }

      &:hover {
        background: $primary;
        color: white;

        .subtitle {
          color: $light-gray;

          a {
            color: white;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }

  .paginator {
    .paginate {
      color: $searchSpecial;
      cursor: pointer;
      user-select: none;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .close {
    @include buttonLike;
    display: inline-block;
    margin-left: 5px;
  }

  summary {
    @include buttonLike;
    outline: none;
    margin-left: 8px;
  }

  .filters {
    margin-bottom: 20px;
    display: inline-block;
    border: solid 1px gainsboro;
    padding: 20px 20px 20px 20px;
  }

  .filtergroup {
    display: inline-block;
    vertical-align: top;
    margin-right: 30px;

    h3 {
      margin-bottom: 0.5em;
    }

    .action {
      color: $primary;
      font-size: 13px;
      @include buttonLike;
      margin: 0.5em 0;
    }
  }
</style>

<div class="body">
  <p>
    <Link back={true} color={true}>{$_("entities.back")}</Link>
  </p>
  {#if !loading && $entities.entities != null && fullText != null && ($entities.entities.count > 0 || pagePushed)}
    <p class="paginator">
      <span>{$_("entities.page")}&nbsp;</span>
      {#if $entities.entities.hasPrev}
        <span class="paginate" on:click={() => prevPage()}>←</span>
      {/if}
      <span class="page"
        >{$entities.entities.page + 1}
        {$_("entities.of")}
        {$entities.entities.numPages}
        ({$_("entities.totalEntityResult", {
          values: { n: $entities.entities.count },
        })})
      </span>
      {#if $entities.entities.hasNext}
        <span class="paginate" on:click={() => nextPage()}>→</span>
      {/if}
    </p>

    <details>
      <!-- Todo: put in separate component -->
      <summary>{$_("entities.filter")}</summary>
      <div class="filters">
        <div>
          <button on:click={applyFilters}>{$_("entities.applyFilters")}</button>
        </div>
        <div class="filtergroup">
          <h3>{$_("entities.kind")}</h3>
          <div class="action" on:click={() => (kindFilter = {})}>
            {$_("entities.clear")}
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.person} />{$_(
                "entities.person",
              )}</label
            >
          </div>
          <div>
            <label
              ><input
                type="checkbox"
                bind:checked={kindFilter.organization}
              />{$_("entities.org")}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.location} />{$_(
                "entities.location",
              )}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.event} />{$_(
                "entities.event",
              )}</label
            >
          </div>
          <div>
            <label
              ><input
                type="checkbox"
                bind:checked={kindFilter.work_of_art}
              />{$_("entities.workOfArt")}</label
            >
          </div>
          <div>
            <label
              ><input
                type="checkbox"
                bind:checked={kindFilter.consumer_good}
              />{$_("entities.consumerGood")}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.address} />{$_(
                "entities.address",
              )}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.date} />{$_(
                "entities.date",
              )}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.number} />{$_(
                "entities.number",
              )}</label
            >
          </div>
          <div>
            <label
              ><input
                type="checkbox"
                bind:checked={kindFilter.phone_number}
              />{$_("entities.phoneNumber")}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.price} />{$_(
                "entities.price",
              )}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.unknown} />{$_(
                "entities.unknown",
              )}</label
            >
          </div>
          <div>
            <label
              ><input type="checkbox" bind:checked={kindFilter.other} />{$_(
                "entities.other",
              )}</label
            >
          </div>
        </div>
        <div class="filtergroup">
          <h3>{$_("entities.occurrences")}</h3>
          <div class="action" on:click={() => (occurrenceFilter = {})}>
            {$_("entities.clear")}
          </div>
          <div>
            <label
              ><input
                type="checkbox"
                bind:checked={occurrenceFilter.proper}
              />{$_("entities.proper")}</label
            >
          </div>
          <div>
            <label
              ><input
                type="checkbox"
                bind:checked={occurrenceFilter.common}
              />{$_("entities.common")}</label
            >
          </div>
          <div>
            <label
              ><input
                type="checkbox"
                bind:checked={occurrenceFilter.unknown}
              />{$_("entities.unknown")}</label
            >
          </div>
        </div>
        <div class="filtergroup">
          <h3>{$_("entities.advanced")}</h3>
          <div>
            {$_("entities.relevanceThreshold")}
            <select bind:value={advancedFilter.relevance}>
              {#each Array(101) as _, i}
                <option value={1 - i / 100}>{100 - i}%</option>
              {/each}
            </select>
          </div>
          <div>
            {$_("entities.knowledgeGraph")}
            <select bind:value={advancedFilter.mid}>
              <option value={null}>---</option>
              <option value={true}>{$_("entities.hasKG")}</option>
              <option value={false}>{$_("entities.noKG")}</option>
            </select>
          </div>
          <div>
            {$_("entities.wikiUrl")}
            <select bind:value={advancedFilter.wikipedia_url}>
              <option value={null}>---</option>
              <option value={true}>{$_("entities.hasWiki")}</option>
              <option value={false}>{$_("entities.noWiki")}</option>
            </select>
          </div>
        </div>
      </div>
    </details>

    {#if selectedEntity != null}
      <div class="entity">
        <h3>
          {selectedEntity.name}
          <span class="close" on:click={() => (selectedEntity = null)}
            >{@html closeSvg}</span
          >
        </h3>
        <ul>
          {#each selectedEntity.occurrences as occurrence}
            <li>
              <Link
                inlineBlock={true}
                toUrl={$entities.document.relativePageUrl(occurrence.page + 1)}
              >
                pg.
                {occurrence.page + 1}:</Link
              >
              <span>{getSnippet(occurrence)[0]}</span><span class="highlight"
                >{getSnippet(occurrence)[1]}</span
              ><span>{getSnippet(occurrence)[2]}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="categories">
      {#each categories as category}
        <div class="category">
          <div class="categorytitle">{category}</div>
          {#each entitiesByCategory[category] as entity}
            <div class="entity" on:click={() => (selectedEntity = entity)}>
              <div class="title">{entity.name}</div>
              <div class="subtitle">
                {$_("entities.occurrence", {
                  values: { n: entity.occurrences.length },
                })}
              </div>
              {#if entity.hasWikiUrl}
                <div class="subtitle">
                  <a href={entity.wikiUrl} target="_blank"
                    >{$_("entities.wikipedia")}</a
                  >
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else if loading == false && $entities.document != null}
    <h2>
      {$_("entities.entityExtraction", {
        values: { title: $entities.document.title },
      })}
    </h2>
    {#if $entities.document.readable}
      <p>
        {$_("entities.extractingEntities")}
        <Progress initializing={true} progress={0} compact={true} />
      </p>
    {:else}
      <p>
        {@html $_("entities.welcome", { values: { contact: CONTACT } })}
      </p>
      <p>
        {$_("entities.manual")}
      </p>
      {#if extractionError}
        {$_("entities.error")}
      {:else if extractionStage == 0 || extractionStage == 2}
        <p><button on:click={extract}>{$_("entities.extract")}</button></p>
        {#if extractionStage == 2}
          <p>{$_("entities.noEntities")}</p>
        {/if}
      {:else if extractionStage == 1}
        <p><i>{$_("entities.starting")}</i></p>
      {/if}
    {/if}
  {:else}{$_("common.loading")}{/if}
</div>
