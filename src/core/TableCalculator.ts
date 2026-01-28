import Konva from "konva";
import type { VisibleRange, ColumnConfig } from "../types";
import { TableConfig } from "./TableConfig";

export class TableCalculator {
	private readonly containerEl: HTMLDivElement;
	private readonly config: TableConfig;

	public totalRowCount: number = 0;
	public totalRowHeight: number = 0;
	public colWidths: number[] = [];
	public totalColWidth: number = 0;
	public totalColCount: number = 0;
	public colOffsets: number[] = [];

	constructor(containerEl: HTMLDivElement, config: TableConfig) {
		this.containerEl = containerEl;
		this.config = config;
		this.calculateTableSize();
	}

	/**
	 * 获取容器的实际宽度
	 */
	public getContainerRealWidth(): number {
		return this.containerEl.clientWidth || 1200;
	}

	/**
	 * 获取容器的实际高度
	 */
	public getContainerRealHeight(): number {
		return this.containerEl.clientHeight || 600;
	}

	/**
	 * 计算表格尺寸
	 */
	private calculateTableSize(): void {
		this.totalRowCount = this.config.records.length;
		this.totalRowHeight = this.totalRowCount * this.config.rowHeight;

		// 计算列宽
		this.colWidths = [];
		this.config.columns.forEach((col: ColumnConfig) => {
			if (col.width === "auto") {
				const titleWidth = col.title.length * 14 + 40;
				this.colWidths.push(Math.max(120, Math.min(400, titleWidth)));
			} else {
				this.colWidths.push(parseInt(col.width as string) || 120);
			}
		});
		this.totalColWidth = this.colWidths.reduce((sum, w) => sum + w, 0);
		this.totalColCount = this.config.columns.length;

		// 计算列宽偏移量
		this.colOffsets = [];
		let offset = 0;
		for (let i = 0; i <= this.totalColCount; i++) {
			this.colOffsets[i] = offset;
			if (i < this.totalColCount) {
				offset += this.colWidths[i];
			}
		}
	}

	/**
	 * 计算可见区域的瓦片范围
	 */
	public calculateVisibleTileRange(
		headerLayer: Konva.Layer,
		tileLayer: Konva.Layer
	): VisibleRange {
		const { tileRowCount, tileColCount, buffer, rowHeight } = this.config;
		const { colWidths } = this;

		const scrollX = -headerLayer.x();
		const scrollY = -tileLayer.y();

		// 调整滚动Y值，减去表头高度，因为表头占据了顶部空间
		const adjustedScrollY = scrollY - this.config.headerHeight;
		// 调整可见区域高度，减去表头高度
		const adjustedContainerHeight =
			this.getContainerRealHeight() - this.config.headerHeight;

		let rawStartRowIndex = 0;
		while (
			rawStartRowIndex < this.totalRowCount &&
			(rawStartRowIndex + 1) * rowHeight <= adjustedScrollY
		) {
			rawStartRowIndex++;
		}

		let endRowIndex = rawStartRowIndex;
		while (
			endRowIndex < this.totalRowCount &&
			endRowIndex * rowHeight < adjustedScrollY + adjustedContainerHeight
		) {
			endRowIndex++;
		}

		endRowIndex = Math.min(
			this.totalRowCount - 1,
			endRowIndex + buffer * tileRowCount
		);
		const startRowIndex = Math.max(0, rawStartRowIndex - buffer * tileRowCount);

		let colOffset = 0,
			rawStartColIndex = 0;
		while (
			rawStartColIndex < this.totalColCount &&
			colOffset + colWidths[rawStartColIndex] <= scrollX
		) {
			colOffset += colWidths[rawStartColIndex];
			rawStartColIndex++;
		}

		let endColOffset = colOffset,
			endColIndex = rawStartColIndex;
		while (
			endColIndex < this.totalColCount &&
			endColOffset < scrollX + this.getContainerRealWidth()
		) {
			endColOffset += colWidths[endColIndex];
			endColIndex++;
		}

		endColIndex = Math.min(
			this.totalColCount - 1,
			endColIndex + buffer * tileColCount
		);

		const startColIndex = Math.max(0, rawStartColIndex - buffer * tileColCount);

		return {
			startRowIndex,
			endRowIndex,
			startColIndex,
			endColIndex,
		};
	}
}
