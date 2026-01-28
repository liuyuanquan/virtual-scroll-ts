import "./style.css";
import { ListTable } from "./core/ListTable";

// 数据加载与表格初始化
fetch(
	"https://lf9-dp-fe-cms-tos.byteorg.com/obj/bit-cloud/VTable/North_American_Superstore_data.json"
)
	.then((res) => res.json())
	.then((data) => {
		const columns = [
			{ field: "Order ID", title: "Order ID", width: "auto" },
			{ field: "Customer ID", title: "Customer ID", width: "auto" },
			{ field: "Product Name", title: "Product Name", width: "auto" },
			{ field: "Category", title: "Category", width: "auto" },
			{ field: "Sub-Category", title: "Sub-Category", width: "auto" },
			{ field: "Region", title: "Region", width: "auto" },
			{ field: "City", title: "City", width: "auto" },
			{ field: "Order Date", title: "Order Date", width: "auto" },
			{ field: "Quantity", title: "Quantity", width: "auto" },
			{ field: "Sales", title: "Sales", width: "auto" },
			{ field: "Profit", title: "Profit", width: "auto" },
		];

		const option = {
			records: data.slice(0).map((item: any, index: number) => {
				return {
					...item,
					"Order ID": "" + index,
				};
			}),
			columns,
			widthMode: "standard",
		};

		const container = document.getElementById(
			"table-container"
		) as HTMLDivElement;
		if (container) {
			const tableInstance = new ListTable(container, option);
			// 将表格实例存储到window对象（用于调试）
			(window as any).tableInstance = tableInstance;

			// 监听自定义事件
			container.addEventListener("cellClick", (e: Event) => {
				console.log("选中单元格：", (e as CustomEvent).detail);
			});
		}
	});
