<style lang="scss">
  .menu {
    @include menu;

    border-top-left-radius: 0;
    border: 1px solid #cdcdcd;
    padding: 7px 0;

    :global(.small) {
      color: $gray;
      font-size: 11px;
      text-transform: uppercase;
      margin: 3px 0 0 0;
    }
  }
</style>

<div class="menu">
  <slot>Define some menu items</slot>
</div>
