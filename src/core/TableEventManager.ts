import Konva from "konva";
import type { CellClickData } from "../types";
import { TableConfig } from "./TableConfig";
import { TableCalculator } from "./TableCalculator";

export type ScrollCallback = () => void;

export class TableEventManager {
	private readonly stage: Konva.Stage;
	private readonly headerLayer: Konva.Layer;
	private readonly tileLayer: Konva.Layer;
	private readonly config: TableConfig;
	private readonly calculator: TableCalculator;

	private isDragging: boolean = false;
	private lastDragPos: { x: number; y: number } = { x: 0, y: 0 };

	constructor(
		stage: Konva.Stage,
		headerLayer: Konva.Layer,
		tileLayer: Konva.Layer,
		config: TableConfig,
		calculator: TableCalculator
	) {
		this.stage = stage;
		this.headerLayer = headerLayer;
		this.tileLayer = tileLayer;
		this.config = config;
		this.calculator = calculator;

		this.bindStageEvents();
	}

	/**
	 * 绑定舞台事件
	 */
	public bindStageEvents(): void {
		const isTouchDevice =
			"ontouchstart" in window || navigator.maxTouchPoints > 0;

		this.stage.on("wheel", (e) => this.handleWheelEvent(e));

		if (isTouchDevice) {
			this.stage.on("touchstart", (e) => this.handleDragStart(e));
			this.stage.on("touchmove", (e) => this.handleDragMove(e));
			this.stage.on("touchend touchcancel", () => this.handleDragEnd());
		} else {
			this.stage.on("mousedown", (e) => this.handleDragStart(e));
			this.stage.on("mousemove", (e) => this.handleDragMove(e));
			this.stage.on("mouseup mouseleave", () => this.handleDragEnd());
		}

		this.stage.on("click", (e) => this.handleCellClick(e));
	}

	/**
	 * 处理拖拽开始事件
	 */
	private handleDragStart(
		e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
	): void {
		e.evt.preventDefault();
		this.isDragging = true;
		const pos = e.evt.type.includes("touch")
			? (e.evt as TouchEvent).touches[0]
			: (e.evt as MouseEvent);
		this.lastDragPos = { x: pos.clientX, y: pos.clientY };
	}

	/**
	 * 处理拖拽移动事件
	 */
	private handleDragMove(
		e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
	): void {
		if (!this.isDragging) return;
		e.evt.preventDefault();
		const pos = e.evt.type.includes("touch")
			? (e.evt as TouchEvent).touches[0]
			: (e.evt as MouseEvent);
		const dx = pos.clientX - this.lastDragPos.x;
		const dy = pos.clientY - this.lastDragPos.y;

		// 计算新的X和Y位置，基于当前图层的位置
		const currentHeaderX = this.headerLayer.x();
		const currentTileY = this.tileLayer.y();

		const newX = currentHeaderX + dx;
		const newY = currentTileY + dy;

		this.handleScroll(newX, newY);

		this.lastDragPos = { x: pos.clientX, y: pos.clientY };
	}

	/**
	 * 处理拖拽结束事件
	 */
	private handleDragEnd(): void {
		this.isDragging = false;
	}

	/**
	 * 处理滚轮事件
	 */
	private handleWheelEvent(e: Konva.KonvaEventObject<WheelEvent>): void {
		e.evt.preventDefault();

		const deltaY = e.evt.deltaY;
		const deltaX = e.evt.deltaX;
		const isShift = e.evt.shiftKey;

		let dx = 0,
			dy = 0;

		if (isShift) {
			dx =
				deltaY * this.config.scrollSpeed * this.config.wheelXMultiplier * 0.01;
		} else {
			dy = deltaY * this.config.scrollSpeed * 0.01;
			dx = deltaX * this.config.scrollSpeed * 0.01;
		}

		// 计算新的X和Y位置，基于当前图层的位置
		const currentHeaderX = this.headerLayer.x();
		const currentTileY = this.tileLayer.y();

		const newX = currentHeaderX - dx;
		const newY = currentTileY - dy;

		this.handleScroll(newX, newY);
	}

	/**
	 * 处理单元格点击事件
	 */
	private handleCellClick(e: Konva.KonvaEventObject<MouseEvent>): void {
		e.evt.preventDefault();
		if (e.evt.button !== 0) return;

		const stagePos = this.stage.getPointerPosition();
		if (!stagePos) return;

		const tableX = stagePos.x - this.tileLayer.x();
		const tableY = stagePos.y - this.tileLayer.y();

		// 减去表头高度，因为表头占据了顶部空间
		const adjustedTableY = tableY - this.config.headerHeight;
		let clickRow = -1;
		let clickCol = -1;

		// 只有当点击位置在表头下方时才计算行索引
		if (adjustedTableY >= 0) {
			clickRow = Math.floor(adjustedTableY / this.config.rowHeight);
		}

		// 使用预缓存的列宽累加结果快速查找列索引
		for (let i = 0; i < this.calculator.colOffsets.length - 1; i++) {
			if (
				tableX >= this.calculator.colOffsets[i] &&
				tableX < this.calculator.colOffsets[i + 1]
			) {
				clickCol = i;
				break;
			}
		}

		if (
			clickRow >= 0 &&
			clickRow < this.calculator.totalRowCount &&
			clickCol >= 0 &&
			clickCol < this.calculator.totalColCount
		) {
			const data: CellClickData = {
				row: clickRow,
				col: clickCol,
				data: this.config.records[clickRow],
			};

			this.stage.fire("table:cellClick", data);
		}
	}

	/**
	 * 处理滚动请求
	 */
	private handleScroll(newX: number, newY: number): void {
		// 计算水平滚动边界
		const maxX = 0;
		const minX = -(
			this.calculator.totalColWidth - this.calculator.getContainerRealWidth()
		);

		// 计算垂直滚动边界
		const maxY = 0;
		// 可见区域高度（减去表头）
		const visibleDataHeight =
			this.calculator.getContainerRealHeight() - this.config.headerHeight;
		// 可滚动的最小位置 = -(数据行总高度 - 可见区域高度)
		const minY = -(this.calculator.totalRowHeight - visibleDataHeight);

		// 限制最终位置在有效范围内
		const finalX = Math.max(minX, Math.min(maxX, newX));
		const finalY = Math.max(minY, Math.min(maxY, newY));

		// 触发滚动完成事件，并传递最终的滚动位置
		this.stage.fire("table:scroll", { finalX, finalY });
	}

	/**
	 * 清理资源
	 */
	public destroy(): void {}
}
