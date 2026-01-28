import Konva from "konva";
import type { VisibleRange } from "../types";
import { TableConfig } from "../core/TableConfig";
import { TableCalculator } from "../core/TableCalculator";

export class HeaderRenderer {
	private readonly layer: Konva.Layer;
	private readonly config: TableConfig;
	private readonly calculator: TableCalculator;

	constructor(
		layer: Konva.Layer,
		config: TableConfig,
		calculator: TableCalculator
	) {
		this.layer = layer;
		this.config = config;
		this.calculator = calculator;
	}

	/**
	 * 创建或更新表头单元格
	 */
	private createOrUpdateHeaderCell(col: number): Konva.Group {
		const { layer, config, calculator } = this;
		const style = config.columns[col].style!;
		const { colOffsets, colWidths } = calculator;
		const { headerHeight, columns } = config;

		const cellX = colOffsets[col];
		const cellY = 0;
		const cellW = colWidths[col];
		const cellH = headerHeight;
		const { headerFillColor } = style;
		const title = columns[col].title || "";

		// 查找现有的表头组
		let headerGroup = layer.findOne(`.header-${col}`) as Konva.Group;

		// 如果不存在，创建新的表头组
		if (!headerGroup) {
			headerGroup = new Konva.Group({
				x: cellX,
				y: cellY,
				name: `header-${col}`,
			});
			layer.add(headerGroup);

			// 添加填充矩形
			headerGroup.add(
				new Konva.Rect({
					x: 0,
					y: 0,
					width: cellW,
					height: cellH,
					fill: headerFillColor,
					name: "header-fill",
				})
			);

			// 添加表头文本
			headerGroup.add(
				new Konva.Text({
					x: 8,
					y: 0,
					width: cellW - 16,
					height: cellH,
					// text: title.toString(),
					text: `header-${col}`,
					fontSize: 14,
					fontWeight: "bold",
					fill: "#333",
					align: "center",
					verticalAlign: "middle",
					ellipsis: true,
					name: "header-text",
				})
			);
		} else {
			// 更新填充颜色
			const fillRect = headerGroup.findOne(".header-fill") as Konva.Rect;
			if (fillRect) {
				fillRect.fill(headerFillColor);
			}

			// 更新文本
			const textElement = headerGroup.findOne(".header-text") as Konva.Text;
			if (textElement) {
				// textElement.text(title.toString());
				textElement.text(`header-${col}`);
			}
		}

		return headerGroup;
	}

	/**
	 * 渲染表头
	 */
	public render(visibleRange: VisibleRange): void {
		if (!this.layer) return;

		const { startColIndex, endColIndex } = visibleRange;

		// 获取当前已有的所有表头单元格 - 使用filter方法精确匹配name以header-开头的元素
		const existingHeaders = this.layer.children.filter((child) =>
			child.name().startsWith("header-")
		);
		const headersToKeep: { [key: number]: boolean } = {};

		// 只渲染可见区域内的表头单元格
		for (let col = startColIndex; col <= endColIndex; col++) {
			// 标记需要保留的表头
			headersToKeep[col] = true;

			this.createOrUpdateHeaderCell(col);
		}

		// 移除不在可见区域内的表头单元格
		existingHeaders.forEach((header) => {
			const headerName = header.name();
			const colMatch = headerName.match(/header-(\d+)/);
			if (colMatch) {
				const col = parseInt(colMatch[1], 10);
				if (!headersToKeep[col]) {
					header.remove();
				}
			}
		});
	}

	/**
	 * 清空表头
	 */
	public clear(): void {
		this.layer.children
			.filter((child) => child.name().startsWith("header-"))
			.forEach((header) => header.remove());
	}
}
