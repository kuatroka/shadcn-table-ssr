<script lang="ts">
	import type { Cik } from "$lib/server/db/types";
	import { goto } from "$app/navigation";
	import { page } from '$app/stores'
	import debounce from 'debounce';	
	
	import {createTable, Subscribe, Render,	createRender} from "svelte-headless-table";
	import {addSortBy, addPagination,	addTableFilter,
		addSelectedRows,addHiddenColumns, addResizedColumns	} from "svelte-headless-table/plugins";
	import { readable, writable, type Writable } from "svelte/store";
	import * as Table from "$lib/components/ui/table";
	import Actions from "./data-table-actions.svelte";
	import { Button } from "$lib/components/ui/button";
	import { CaretSort, ChevronDown, ChevronUp } from "radix-icons-svelte";
	import { X, ArrowUpDown } from 'lucide-svelte';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { cn } from "$lib/utils";
	import { Input } from "$lib/components/ui/input";


	export let order_by: string = "";
	export let order_dir: string = "";


	export let data: Cik[]; 
	const entries: Writable<Cik[]> = writable([]);
	$: $entries = data;

	const table = createTable(entries, {
		resize: addResizedColumns(),
		sort: addSortBy({
			serverSide: true,
			toggleOrder: ['desc', 'asc']
		}),
		page: addPagination({
			serverSide: true,
		}),
		filter: addTableFilter({
			serverSide: true,
			// fn: ({ filterValue, value }) => value.includes(filterValue)
		}),
		select: addSelectedRows(),
		hide: addHiddenColumns()
	});

	const columns = table.createColumns([

	
		table.column({
			header: "CIK",
			accessor: "cik",
			plugins: { sort: { disable: false }, filter: { exclude: false } }
		}),
		table.column({ header: "Superinvestor", accessor: "cik_name"}),

		table.column({
			header: "Cumulative TWRR",
			accessor: "cum_twrr_cons",
			cell: ({ value }) => {
				const formatted = new Intl.NumberFormat("en-US", {
					style: "percent",
				}).format(value);
				return formatted;
    },
			plugins: {
				sort: {
					disable: false
				},
				filter: {
					exclude: true
				}
			}
		}),
		
		table.column({
			header: "Actions",
			accessor: ({ cik }) => cik,
			cell: (item) => {
				return createRender(Actions, { id: item.value });
			},
			plugins: {
				sort: {
					disable: true
				}
			}
		})
	]);

	const {
		headerRows,
		pageRows,
		tableAttrs,
		tableBodyAttrs,
		flatColumns,
		pluginStates,
	} = table.createViewModel(columns);

	const { sortKeys } = pluginStates.sort;
	const { columnWidths } = pluginStates.resize;

	const { hiddenColumnIds } = pluginStates.hide;
	const ids = flatColumns.map((c) => c.id);
	let hideForId = Object.fromEntries(ids.map((id) => [id, true]));

	$: $hiddenColumnIds = Object.entries(hideForId)
		.filter(([, hide]) => !hide)
		.map(([id]) => id);

	let { pageIndex, pageSize } = pluginStates.page;
	const { filterValue } = pluginStates.filter;

	$: q = $page.url.searchParams.get('q') || '';
	$: skip_param = Number($page.url.searchParams.get('skip') || 0);
	$: limit_param = Number($page.url.searchParams.get('limit') || 0);

	$: filter = q || '';
	$: $pageSize =  limit_param || 5;
	$: $pageIndex = (skip_param / limit_param) || 0;

	$:_totalRows = data[0].num_entries;
	$: _totalPages = Math.ceil(_totalRows / $pageSize)


	const { selectedDataIds } = pluginStates.select;

	// $: serverItemCount = totalRowCount;

	// async function updateQuery() {
	// 	const q = new URLSearchParams();
	// 	q.set('order_by', $sortKeys[0].id);
	// 	q.set('order_dir', $sortKeys[0].order);
	// 	q.set('filter', $filterValue);
	// 	q.set('limit', String($pageSize));
	// 	q.set('skip', String($pageSize * $pageIndex));
	// };

	const hideableCols = ["id", "cik"];
	$: _sortKeys = $sortKeys;
	
	$: _totalViewedEntries = ($pageIndex * $pageSize + $pageRows.length)

	$: _hasNextPage = $pageIndex + 1 < _totalPages;
	$: _hasPreviousPage = $pageIndex > 0;

	$: order_by = _sortKeys[0]?.id || '';
	$: order_dir = _sortKeys[0]?.order || '';

	const handleFilterChange = debounce(() => {
	goto(`?limit=${$pageSize}&skip=${$pageSize * $pageIndex}&q=${filter}&order_by=${order_by}&order_dir=${order_dir}`,
		{  replaceState: true, keepFocus: true });
  }, 100);

// TODO: Displayed entries and pages are wrong when clicking next multiple Times
// and then using search box. The paging gets all messed up

</script>
<!-- skip_param: {skip_param} <br>
limit_param: {limit_param} <br>
$pageIndex + 1:    {$pageIndex + 1} <br>
_totalPages:    {_totalPages} <br>
$pageRows.length:    {$pageRows.length} <br> -->

<div class="w-full">
	<div class="mb-4 flex items-center gap-4">
		<Input
		class="max-w-sm" 
		placeholder="Filter superinvestors..."
		type="search"
		bind:value={filter}
		on:input={handleFilterChange} 
	/>
	
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="outline" class="ml-auto" builders={[builder]}>
					Columns <ChevronDown class="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				{#each flatColumns as col}
					{#if hideableCols.includes(col.id)}
						<DropdownMenu.CheckboxItem
							bind:checked={hideForId[col.id]}
						>
							{col.header}
						</DropdownMenu.CheckboxItem>
					{/if}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="rounded-md border">
		<Table.Root {...$tableAttrs}>
			<Table.Header>
				{#each $headerRows as headerRow}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe
									attrs={cell.attrs()}
									let:attrs
									props={cell.props()}
									let:props
								>
									<Table.Head class="w-1/6"
										{...attrs}
									>
										{#if props.sort.disabled}
											<Render of={cell.render()} />
										{:else}
										<Button variant="ghost" on:click={(e) => {
											props.sort.toggle(e);
											handleFilterChange();
										}}>
											<Render of={cell.render()} />
											
											{#if props.sort.order === 'asc'}
												<ChevronUp class="ml-2 h-4 w-4" />
											{:else if props.sort.order === 'desc'}
												<ChevronDown class="ml-2 h-4 w-4" />
												{:else}
												<CaretSort class="ml-2 h-4 w-4" />
											{/if}
										</Button>
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
						<Table.Row 
							{...rowAttrs}
							data-state={$selectedDataIds[row.id] && "selected"}
						>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell 
										{...attrs}
									>
									{#if cell.id === 'cik_name'}
										<a href="/{row.cells.find(c => c.id === 'cik').value}" 
										class="line-clamp-1">{cell.value}</a>
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
	<div class="flex items-center justify-end space-x-2 py-4">
		<div class="flex-1 text-sm text-muted-foreground">
			{_totalViewedEntries} of 
			{_totalRows} Entries
		</div>
		<Button 
			variant="outline"
			size="sm" 
			on:click={() => {$pageIndex = $pageIndex - 1;
							handleFilterChange();}}
			disabled={!_hasPreviousPage}>Previous</Button>
		<div class="flex text-sm text-muted-foreground">
			{$pageIndex + 1} of {_totalPages} Pages			
		<!-- <span> {$pageIndex + 1} out of {$pageCount}</span> -->
		</div>

		<Button
			variant="outline"
			size="sm"
			disabled={!_hasNextPage}
			on:click={() => {
				$pageIndex = $pageIndex + 1,
				handleFilterChange()
			}}>Next</Button
		>
	</div>
</div>


<!-- #TODO: Server side search and paginatin mostly work, but needs refinement. Sort is not implemented yet at all -->