import Konva from "konva";
import type {
	TableOption,
	VisibleRange,
	SelectedCell,
	CellClickData,
} from "../types";
import { TableConfig } from "./TableConfig";
import { TableCalculator } from "./TableCalculator";
import { TableEventManager } from "./TableEventManager";
import { HeaderRenderer } from "../renderers/HeaderRenderer";
import { CellRenderer } from "../renderers/CellRenderer";
import { GridRenderer } from "../renderers/GridRenderer";

export class ListTable {
	private containerEl: HTMLDivElement;
	private config: TableConfig;
	private calculator: TableCalculator;
	private selectedCell: SelectedCell = { row: -1, col: -1 };
	private lastRenderedRange: VisibleRange | null = null;

	// Konva相关实例
	private stage: Konva.Stage;
	private tileLayer: Konva.Layer;
	private headerLayer: Konva.Layer;

	// 渲染器
	private headerRenderer: HeaderRenderer;
	private cellRenderer: CellRenderer;
	private gridRenderer: GridRenderer;

	// 事件管理器
	private eventManager: TableEventManager;

	constructor(containerEl: HTMLDivElement, option: TableOption) {
		this.containerEl = containerEl;

		// 初始化配置
		this.config = new TableConfig(option);

		// 初始化计算器
		this.calculator = new TableCalculator(this.containerEl, this.config);

		// 初始化Konva舞台和图层
		this.stage = new Konva.Stage({
			container: this.containerEl,
			width: this.containerEl.clientWidth,
			height: this.containerEl.clientHeight,
			x: 0,
			y: 0,
		});

		this.headerLayer = new Konva.Layer({ name: "headerLayer" });
		this.tileLayer = new Konva.Layer({ name: "tileLayer" });

		this.stage.add(this.tileLayer);
		this.stage.add(this.headerLayer);

		// 初始化渲染器
		this.headerRenderer = new HeaderRenderer(
			this.headerLayer,
			this.config,
			this.calculator
		);
		this.cellRenderer = new CellRenderer(
			this.tileLayer,
			this.config,
			this.calculator,
			this.selectedCell
		);
		this.gridRenderer = new GridRenderer(
			this.headerLayer,
			this.tileLayer,
			this.config,
			this.calculator
		);

		// 初始化事件管理器
		this.eventManager = new TableEventManager(
			this.stage,
			this.headerLayer,
			this.tileLayer,
			this.config,
			this.calculator
		);

		// 设置事件回调
		this.setupEventCallbacks();

		// 初始渲染
		this.renderAll();
	}

	/**
	 * 设置事件回调
	 */
	private setupEventCallbacks(): void {
		// 监听窗口大小变化事件
		window.addEventListener("resize", this.handleResize.bind(this));

		// 监听stage上的自定义事件
		this.stage.on("table:cellClick", (e) => {
			this.handleCellClick(e as unknown as CellClickData);
		});

		// 监听stage上的滚动完成事件
		this.stage.on("table:scroll", (e) => {
			this.handleScroll(e as unknown as { finalX: number; finalY: number });
		});
	}

	/**
	 * 窗口大小变化处理
	 */
	private handleResize(): void {
		// 更新舞台尺寸
		this.stage.width(this.containerEl.clientWidth);
		this.stage.height(this.containerEl.clientHeight);
		// 重新渲染所有内容
		this.renderAll();
	}

	/**
	 * 处理滚动事件
	 */
	private handleScroll(data: { finalX: number; finalY: number }): void {
		const { finalX, finalY } = data;

		// 设置表头图层的位置（仅水平滚动，垂直固定）
		this.headerLayer.x(finalX);
		this.headerLayer.y(0);

		// 设置内容图层的位置（可水平和垂直滚动）
		this.tileLayer.x(finalX);
		this.tileLayer.y(finalY);

		// 重新渲染所有内容
		this.renderAll();
	}

	/**
	 * 单元格点击处理
	 */
	private handleCellClick(data: CellClickData): void {
		// 保存之前选中的单元格位置
		const prevSelectedRow = this.selectedCell.row;
		const prevSelectedCol = this.selectedCell.col;

		// 更新选中状态
		this.selectedCell = { row: data.row, col: data.col };

		// 更新渲染器的选中状态
		this.cellRenderer.setSelectedCell(this.selectedCell);

		// 局部更新：只更新选中状态变化的单元格
		this.cellRenderer.updateSelectedCell(
			prevSelectedRow,
			prevSelectedCol,
			data.row,
			data.col
		);

		// 发出单元格点击事件
		this.emit("cellClick", data);
	}

	/**
	 * 统一渲染所有元素：表头、单元格和网格线
	 */
	private renderAll(): void {
		const renderStart = performance.now();
		// 统一计算可见区域范围
		const currentRange = this.calculator.calculateVisibleTileRange(
			this.headerLayer,
			this.tileLayer
		);

		// 检查可见范围是否变化，仅在变化时重新渲染
		if (
			this.lastRenderedRange &&
			this.lastRenderedRange.startRowIndex === currentRange.startRowIndex &&
			this.lastRenderedRange.endRowIndex === currentRange.endRowIndex &&
			this.lastRenderedRange.startColIndex === currentRange.startColIndex &&
			this.lastRenderedRange.endColIndex === currentRange.endColIndex
		) {
			return; // 范围没有变化，不需要重新渲染
		}

		// 更新渲染范围记录
		this.lastRenderedRange = currentRange;

		// 渲染单元格（中间绘制，显示在表头上面）
		this.cellRenderer.render(currentRange);

		// 渲染表头（先绘制，显示在最底层）
		this.headerRenderer.render(currentRange);

		// 绘制网格线（最后绘制，显示在最上面，不会被遮挡）
		this.gridRenderer.render(currentRange);

		// 批量绘制所有图层
		this.headerLayer.batchDraw();
		this.tileLayer.batchDraw();

		// 输出性能统计信息
		this.logPerformanceStats(currentRange, renderStart);
	}

	/**
	 * 输出性能统计信息
	 */
	private logPerformanceStats(
		currentRange: VisibleRange,
		renderStart: number
	): void {
		// 统计headerLayer的子节点信息
		const headerChildren = this.headerLayer.children;
		const headerCount = headerChildren.filter((child) =>
			child.name().startsWith("header-")
		).length;
		const headerGridLinesGroup = headerChildren.find(
			(child) => child.name() === "grid-lines"
		) as Konva.Group;
		const headerVerticalLinesCount = headerGridLinesGroup
			? headerGridLinesGroup.children.filter((line) =>
					line.name().startsWith("v-line-")
			  ).length
			: 0;
		const headerTotalChildren = headerChildren.length;
		const headerGridLinesChildrenCount = headerGridLinesGroup
			? headerGridLinesGroup.children.length
			: 0;

		// 统计tileLayer的子节点信息
		const tileChildren = this.tileLayer.children;
		const cellCount = tileChildren.filter((child) =>
			child.name().startsWith("cell-")
		).length;
		const tileGridLinesGroup = tileChildren.find(
			(child) => child.name() === "grid-lines"
		) as Konva.Group;
		const tileLinesCount = tileGridLinesGroup
			? tileGridLinesGroup.children.length
			: 0;
		const horizontalLinesCount = tileGridLinesGroup
			? tileGridLinesGroup.children.filter((line) =>
					line.name().startsWith("h-line-")
			  ).length
			: 0;
		const tileVerticalLinesCount = tileGridLinesGroup
			? tileGridLinesGroup.children.filter((line) =>
					line.name().startsWith("v-line-")
			  ).length
			: 0;
		const tileTotalChildren = tileChildren.length;

		// 获取内存使用情况（如果浏览器支持）
		const memoryStats =
			typeof performance.memory !== "undefined"
				? {
						堆大小限制:
							(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) +
							" MB",
						已使用堆大小:
							(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) +
							" MB",
						总堆大小:
							(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) +
							" MB",
				  }
				: {
						不支持: "当前浏览器不支持内存使用统计",
				  };

		// 性能统计信息
		const performanceStats = {
			渲染时间: (performance.now() - renderStart).toFixed(2) + " ms",
			内存使用: memoryStats,
			可见范围: {
				起始行: currentRange.startRowIndex,
				结束行: currentRange.endRowIndex,
				起始列: currentRange.startColIndex,
				结束列: currentRange.endColIndex,
			},
			HeaderLayer: {
				总子节点数: headerTotalChildren,
				表头数量: headerCount,
				网格线组存在: !!headerGridLinesGroup,
				网格线组子节点数: headerGridLinesChildrenCount,
				竖线数量: headerVerticalLinesCount,
			},
			TileLayer: {
				总子节点数: tileTotalChildren,
				单元格数量: cellCount,
				网格线组存在: !!tileGridLinesGroup,
				网格线组子节点数: tileLinesCount,
				横线数量: horizontalLinesCount,
				竖线数量: tileVerticalLinesCount,
			},
			总计: {
				节点总数: headerTotalChildren + tileTotalChildren,
				可见行列数: {
					行数: currentRange.endRowIndex - currentRange.startRowIndex + 1,
					列数: currentRange.endColIndex - currentRange.startColIndex + 1,
				},
			},
		};

		console.log("性能统计信息:", performanceStats);
		// @ts-ignore
		window.tileLayer = this.tileLayer;
		// @ts-ignore
		window.headerLayer = this.headerLayer;
	}

	/**
	 * 触发自定义事件
	 */
	private emit(eventName: string, data: any): void {
		const event = new CustomEvent(eventName, { detail: data });
		this.containerEl.dispatchEvent(event);
	}

	/**
	 * 清理资源
	 */
	public destroy(): void {
		// 清理资源
		window.removeEventListener("resize", this.handleResize.bind(this));
		this.eventManager.destroy();
	}
}
