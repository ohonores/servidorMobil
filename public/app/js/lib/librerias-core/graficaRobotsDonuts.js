
var salesData=[
	{label:"Trabando", color:"#3366CC"},
	{label:"Bloqueados", color:"#DC3912"},
	{label:"Esperando", color:"#CCAEAE"},
	{label:"Suspendidos", color:"#FF9900"}
	
];

var svgA = d3.select("robotgraficaA").append("svg").attr("width",350).attr("height",300);
var svgB = d3.select("robotgraficaB").append("svg").attr("width",350).attr("height",300);
var svgC = d3.select("robotgraficaC").append("svg").attr("width",350).attr("height",300);
var svgD = d3.select("robotgraficaD").append("svg").attr("width",350).attr("height",300);
var total= 0;
svgA.append("g").attr("id","enviar");
svgB.append("g").attr("id","autorizador");
svgC.append("g").attr("id","pendientes");
svgD.append("g").attr("id","emails");
//svg.append("g").attr("id","quotesDonut2");
svgA.append("text")
        .attr("x", 150)             
        .attr("y", 20)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
		.style("font-weight", "bold") 
        .style("text-decoration", "none")  
        .text("Robots de Envio ");
svgB.append("text")
        .attr("x", 150)             
        .attr("y", 20)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
		.style("font-weight", "bold") 
        .style("text-decoration", "none")  
        .text("Robots Autorizadores de Xmls" );
svgC.append("text")
        .attr("x", 150)             
        .attr("y", 20)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
		.style("font-weight", "bold") 
        .style("text-decoration", "none")  
        .text("Robots Pendiente Autorizacion");
svgD.append("text")
        .attr("x", 150)             
        .attr("y", 20)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
		.style("font-weight", "bold") 
        .style("text-decoration", "none")  
        .text("Robots Env\u00EDo de emails");
		
Donut3D.draw("enviar", randomData(), 150, 150, 130, 100, 30, 0);
Donut3D.draw("autorizador", randomData(), 150, 150, 130, 100, 30, 0);
Donut3D.draw("pendientes", randomData(), 150, 150, 130, 100, 30, 0.1);
Donut3D.draw("emails", randomData(), 150, 150, 130, 100, 30, 0.1);
function changeData(){
	Donut3D.transition("enviar", randomData(), 130, 100, 30, 0.2);
	Donut3D.transition("autorizador", randomData(), 130, 100, 30, 0);
	Donut3D.transition("pendientes", randomData(), 130, 100, 30, 0.1);
	Donut3D.transition("emails", randomData(), 130, 100, 30, 0.1);
}

function randomData(){
	return salesData.map(function(d){ 
		return {label:d.label, value:100, color:d.color};});
}
function randomDataA(){
	return salesData.map(function(d){ 
		return {label:d.label, value:parseFloat(d.valor*1), color:d.color};});
}
