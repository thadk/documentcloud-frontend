<script>
  import Loader from "@/common/Loader";
  import Button from "@/common/Button";
  import Autocomplete from "@/common/Autocomplete";
  import { layout } from "@/manager/layout";
  import { viewer } from "@/viewer/viewer";
  import { autocompleteUsers } from "@/api/orgAndUser";
  import { orgsAndUsers } from "@/manager/orgsAndUsers";
  import { changeOwnerForDocuments } from "@/manager/documents";
  import { nameSingularNumberPlural } from "@/util/string";
  import emitter from "@/emit";
  import { sameProp } from "@/util/array";
  import deepEqual from "fast-deep-equal";
  import { _ } from "svelte-i18n";

  const emit = emitter({
    dismiss() {},
  });

  let user = sameProp(layout.ownerEditDocuments, (x) => x.user, deepEqual);
  let organization = sameProp(
    layout.ownerEditDocuments,
    (x) => x.organization,
    deepEqual,
  );
  let valid = true;
  $: invalidReason =
    user == null
      ? $_("dialogOwnerDialog.selectUser")
      : organization == null
      ? $_("dialogOwnerDialog.selectOrg")
      : null;

  $: isViewer = $viewer.document != null;
  $: numOwnerSelected = isViewer ? 1 : $layout.numOwnerSelected;

  async function ownerChange(user, organization) {
    if (!valid || isViewer) return;
    changeOwnerForDocuments(
      layout.ownerEditDocuments,
      user,
      organization,
      layout,
    );
    emit.dismiss();
  }
</script>

<style lang="scss">
  table {
    position: border-box;
    width: 100%;
    font-size: 16px;
    font-family: inherit;
  }

  td:first-child {
    white-space: nowrap;
    padding-right: 5px;
  }

  td:last-child {
    width: 100%;
    position: relative;
  }

  .warning {
    padding: 15px 30px;
    background: $warning;
    border-radius: $radius;
    display: table;
    max-width: 700px;
  }
</style>

<!-- Don't show until self orgs have populated -->
<Loader active={$orgsAndUsers.selfOrgs == null}>
  <div>
    <div class="mcontent">
      <h1>
        {$_("dialogOwnerDialog.changeOwner", {
          values: { n: numOwnerSelected },
        })}
      </h1>
      <p class="warning">
        {$_("dialogOwnerDialog.accessWarning", {
          values: { n: numOwnerSelected },
        })}
      </p>
      <table>
        <tr>
          <td>{$_("dialogOwnerDialog.user")}</td>
          <td>
            <div>
              <Autocomplete
                placeholder={$_("dialogOwnerDialog.filterUsers")}
                method={(prefix) =>
                  autocompleteUsers(prefix, $orgsAndUsers.orgIdList)}
                bind:value={user}
              />
            </div>
          </td>
        </tr>
        <tr>
          <td>Organization:</td>
          <td>
            <div>
              <Autocomplete
                placeholder={$_("dialogOwnerDialog.filterOrgs")}
                allData={$orgsAndUsers.selfOrgs || []}
                bind:value={organization}
              />
            </div>
          </td>
        </tr>
      </table>
      <div class="buttonpadded">
        <Button
          disabledReason={invalidReason}
          on:click={() => ownerChange(user, organization)}
          >{$_("dialog.save")}</Button
        >
        <Button secondary={true} on:click={emit.dismiss}
          >{$_("dialog.cancel")}</Button
        >
      </div>
    </div>
  </div>
</Loader>
