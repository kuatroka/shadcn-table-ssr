<script lang="ts">
    import type { PageData } from '../src/routes/$types';
    import { get } from 'svelte/store';
    import type { Cik } from '$lib/server/db/types.js';
    
    import { createTable, Render, Subscribe, createRender } from "svelte-headless-table";
    import { addPagination, addSortBy, addColumnFilters } from "svelte-headless-table/plugins";
    import { readable, writable } from "svelte/store";
    import * as Table from "$lib/components/ui/table";
    import {Button }    from "$lib/components/ui/button";
    import DataTableActions from "../src/routes/data-table-actions.svelte";
    
    export let data: PageData;
    let entries =  data.ciks;
    $: _serverItemCount = entries[0]?.num_entries
    
    
    let table = createTable(writable(entries), {
        page: addPagination({serverSide: true,
        initialPageIndex: 0,
        pageSize: 10}),
        sort: addSortBy({serverSide: true}),
        filter: addColumnFilters({serverSide: true}),
    });
    
    const columns = table.createColumns([
        table.column({
            header: "ID",
            accessor: "id",        
        }),
        table.column({
            header: "CIK",
            accessor: "cik",        
        }),
        table.column({
            header: "Name",
            accessor: "cik_name",
        }),
        table.column({
            header: "Amount",
            accessor: "num_entries",
            cell: ({ value }: { value: string }) => {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(parseFloat(value));
      return formatted;
    }
        }),
        table.column({
            header: "",
            accessor: ({id}: {id: string }) => id,
            cell: ({ value }: { value: string }) => {
        return createRender(DataTableActions, { id: value });
      }
    })

    ]);
    
    export const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
        table.createViewModel(columns);

    const {sortKeys} = pluginStates.sort;
    const {filterValue} = pluginStates.filter;
    // const {pageSize} = pluginStates.filter;

    let { hasNextPage, hasPreviousPage, PageSize, pageIndex, PageCount, initialPageIndex, initialPageSize } = pluginStates.page;  
    $: PageSize = 4
    
</script>
<div>
{$pageIndex}

    <!-- initialPageIndex:{PageIndex}  -->
    <br>
     <!-- PageSize:{$PageSize} -->
    <!-- ServerItemCount:{_serverItemCount} -->
    <!-- ItemCount:{ItemCount}  -->
</div>
<!-- {entries[0].cik} -->
<!-- {$initialPageSize} -->
<!-- {$hasNextPage}
{$hasPreviousPage} 
{$pageIndex + 1}  -->

<div class="flex items-center justify-end space-x-2 py-4">
    <Button
      variant="outline"
      size="sm"
      on:click={() => ($pageIndex = $pageIndex - 1)}
      disabled={!$hasPreviousPage}>Previous</Button
    >
    <Button
      variant="outline"
      size="sm"
      disabled={!$hasNextPage}
      on:click={() => ($pageIndex = $pageIndex + 1)}>Next</Button
    >
  </div>


    
<div class="rounded-md border ">
    <Table.Root {...$tableAttrs}>
        <Table.Header>
        {#each $headerRows as headerRow}
            <Subscribe rowAttrs={headerRow.attrs()}>
            <Table.Row>
                {#each headerRow.cells as cell (cell.id)}
                <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
                    <Table.Head {...attrs}>
                        {#if cell.id === "cik_name"}
                        <div class="text-right">
                          <Render of={cell.render()} />
                        </div>
                        {:else if cell.id === "num_entries"}
                        <div class="uppercase text-center">
                          <Render of={cell.render()} />
                        </div>
                      {:else}
                        <Render of={cell.render()} />
                      {/if}
                    </Table.Head>
                </Subscribe>
                {/each}
            </Table.Row>
            </Subscribe>
        {/each}
        </Table.Header>
        <Table.Body {...$tableBodyAttrs}>
        {#each $pageRows as row (row.id)}
            <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
            <Table.Row {...rowAttrs}>
                {#each row.cells as cell (cell.id)}
                <Subscribe attrs={cell.attrs()} let:attrs>
                    <Table.Cell {...attrs}>
                        {#if cell.id === "num_entries"}
                        <div class="text-right font-semibold">
                          <Render of={cell.render()} />
                        </div>
                      {:else if cell.id === "cik_name"}
                        <div class="uppercase text-right">
                          <Render of={cell.render()} />
                        </div>
                      {:else}
                        <Render of={cell.render()} />
                      {/if}
                    </Table.Cell>
                </Subscribe>
                {/each}
            </Table.Row>
            </Subscribe>
        {/each}
        </Table.Body>
    </Table.Root>
    </div>