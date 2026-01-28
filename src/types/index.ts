// 表格列定义接口
export interface ColumnConfig {
	field: string;
	width: string | number;
	title: string;
	headerStyle?: any;
	style?: CellStyleConfig;
	customRender?: () => any;
}

// 单元格样式配置
export interface CellStyleConfig {
	borderColor: string;
	borderWidth: number;
	selectedBorderColor: string;
	selectedBorderWidth: number;
	selectedFillColor: string;
	headerFillColor: string;
}

// 滚动配置
export interface ScrollConfig {
	speed: number;
	wheelXMultiplier: number;
}

// 瓦片配置
export interface TileConfig {
	rowCount: number;
	colCount: number;
}

// 表格配置选项
export interface TableOption {
	records: Record<string, any>[];
	columns: ColumnConfig[];
	widthMode?: string;
	rowHeight?: number;
	tile?: TileConfig;
	buffer?: number;
	scroll?: ScrollConfig;
}

// 可见范围配置
export interface VisibleRange {
	startRowIndex: number;
	endRowIndex: number;
	startColIndex: number;
	endColIndex: number;
}

// 选中单元格状态
export interface SelectedCell {
	row: number;
	col: number;
}

// 点击事件数据
export interface CellClickData {
	row: number;
	col: number;
	data: Record<string, any>;
}

// 单元格位置和尺寸接口
export interface CellPosition {
	x: number;
	y: number;
	width: number;
	height: number;
}

// 单元格信息接口
export interface CellInfo {
	row: number;
	col: number;
	value: string;
	isSelected: boolean;
}

// 表头信息接口
export interface HeaderInfo {
	col: number;
	title: string;
}

// 扩展 Performance 接口以支持 memory 属性（Chrome 浏览器扩展属性）
declare global {
	interface Performance {
		memory?: {
			jsHeapSizeLimit: number;
			totalJSHeapSize: number;
			usedJSHeapSize: number;
		};
	}
}
