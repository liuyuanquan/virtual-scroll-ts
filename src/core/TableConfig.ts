import type {
	TableOption,
	ColumnConfig,
	CellStyleConfig,
	TileConfig,
	ScrollConfig,
} from "../types";

export class TableConfig {
	private readonly defaultCellStyle: CellStyleConfig = {
		borderColor: "#e2e4e8",
		borderWidth: 1,
		selectedBorderColor: "#0000ff",
		selectedBorderWidth: 2,
		selectedFillColor: "#e1e0fb",
		headerFillColor: "#ecf1f5",
	};

	private readonly defaultConfig: Required<TableOption> = {
		records: [],
		columns: [],
		widthMode: "standard",
		rowHeight: 40,
		tile: { rowCount: 1, colCount: 1 },
		buffer: 1,
		scroll: { speed: 25, wheelXMultiplier: 1.8 },
	};

	public readonly records: Record<string, any>[];
	public readonly columns: ColumnConfig[];
	public readonly widthMode: string;
	public readonly rowHeight: number;
	public readonly tile: TileConfig;
	public readonly buffer: number;
	public readonly scroll: ScrollConfig;
	public readonly headerHeight: number;

	constructor(option: TableOption) {
		const mergedConfig = Object.assign({}, this.defaultConfig, option);

		this.records = mergedConfig.records;

		this.columns = mergedConfig.columns.map((col) => ({
			...col,
			style: col.style || this.defaultCellStyle,
		}));

		this.widthMode = mergedConfig.widthMode;
		this.rowHeight = mergedConfig.rowHeight;
		this.tile = mergedConfig.tile;
		this.buffer = mergedConfig.buffer;
		this.scroll = mergedConfig.scroll;
		this.headerHeight = 40; // 默认表头高度
	}

	public get tileRowCount(): number {
		return this.tile.rowCount;
	}

	public get tileColCount(): number {
		return this.tile.colCount;
	}

	public get scrollSpeed(): number {
		return this.scroll.speed;
	}

	public get wheelXMultiplier(): number {
		return this.scroll.wheelXMultiplier;
	}
}
