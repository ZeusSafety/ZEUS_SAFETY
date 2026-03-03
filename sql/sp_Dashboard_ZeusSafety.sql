DELIMITER $$

DROP PROCEDURE IF EXISTS sp_Dashboard_ZeusSafety$$

CREATE PROCEDURE sp_Dashboard_ZeusSafety(
  IN p_producto      VARCHAR(255),
  IN p_mes          VARCHAR(255),
  IN p_canal        VARCHAR(255),
  IN p_clasificacion VARCHAR(255),
  IN p_linea        VARCHAR(255),
  IN p_cliente      VARCHAR(255),
  IN p_pago         VARCHAR(255),
  IN p_region       VARCHAR(255),
  IN p_inicio       DATE,
  IN p_fin          DATE
)
BEGIN
  DECLARE v_inicio DATE;
  DECLARE v_fin DATE;
  
  SET v_inicio = IFNULL(p_inicio, '2024-01-01');
  SET v_fin = IFNULL(p_fin, CURDATE());
  
  -- Construir condiciones WHERE dinámicas
  -- FILTRO AUTOMÁTICO: Solo productos de Zeus Safety (LINEA = 'ZEUS-SAFETY' o 'ZEUS SAFETY')
  SET @where_clause = CONCAT('vo.FECHA BETWEEN ''', v_inicio, ''' AND ''', v_fin, ''' AND (vo.LINEA = ''ZEUS-SAFETY'' OR vo.LINEA = ''ZEUS SAFETY'')');
  
  -- Filtro por producto (LIKE)
  IF p_producto IS NOT NULL AND p_producto != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND EXISTS (SELECT 1 FROM detalle_ventas dv WHERE dv.ID_VENTA = vo.ID_VENTA AND dv.PRODUCTO LIKE ''%', p_producto, '%'')');
  END IF;
  
  -- Filtro por mes (formato YYYY-MM)
  IF p_mes IS NOT NULL AND p_mes != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND CONCAT(YEAR(vo.FECHA), ''-'', LPAD(MONTH(vo.FECHA), 2, ''0'')) = ''', p_mes, '''');
  END IF;
  
  -- Filtro por canal
  IF p_canal IS NOT NULL AND p_canal != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND vo.CANAL_VENTA = ''', p_canal, '''');
  END IF;
  
  -- Filtro por clasificación
  IF p_clasificacion IS NOT NULL AND p_clasificacion != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND vo.CLASIFICACION = ''', p_clasificacion, '''');
  END IF;
  
  -- Filtro por línea
  IF p_linea IS NOT NULL AND p_linea != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND vo.LINEA = ''', p_linea, '''');
  END IF;
  
  -- Filtro por cliente
  IF p_cliente IS NOT NULL AND p_cliente != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND vo.CLIENTE = ''', p_cliente, '''');
  END IF;
  
  -- Filtro por pago
  IF p_pago IS NOT NULL AND p_pago != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND vo.FORMA_DE_PAGO = ''', p_pago, '''');
  END IF;
  
  -- Filtro por región
  IF p_region IS NOT NULL AND p_region != '' THEN
    SET @where_clause = CONCAT(@where_clause, ' AND vo.REGION = ''', p_region, '''');
  END IF;
  
  -- 1) KPIs (Total generado y Cantidad de ventas)
  SET @sql_kpi = CONCAT('
    SELECT 
      COALESCE(SUM(dv.TOTAL), 0) as total_generado,
      COUNT(DISTINCT vo.ID_VENTA) as cantidad_ventas
    FROM ventas_online vo
    INNER JOIN detalle_ventas dv ON dv.ID_VENTA = vo.ID_VENTA
    WHERE ', @where_clause);
  
  PREPARE stmt_kpi FROM @sql_kpi;
  EXECUTE stmt_kpi;
  DEALLOCATE PREPARE stmt_kpi;
  
  -- 2) Ranking de Compradores (Clientes)
  SET @sql_clientes = CONCAT('
    SELECT 
      vo.CLIENTE as cliente,
      COUNT(DISTINCT vo.ID_VENTA) as cantidad,
      COALESCE(SUM(dv.TOTAL), 0) as monto_total
    FROM ventas_online vo
    INNER JOIN detalle_ventas dv ON dv.ID_VENTA = vo.ID_VENTA
    WHERE ', @where_clause, '
    GROUP BY vo.CLIENTE
    ORDER BY cantidad DESC, monto_total DESC');
  
  PREPARE stmt_clientes FROM @sql_clientes;
  EXECUTE stmt_clientes;
  DEALLOCATE PREPARE stmt_clientes;
  
  -- 3) Productos Vendidos
  SET @sql_productos = CONCAT('
    SELECT 
      dv.PRODUCTO as producto,
      SUM(CASE WHEN UPPER(IFNULL(dv.UNIDAD_MEDIDA, '''')) LIKE ''%UNIDAD%'' THEN dv.CANTIDAD ELSE 0 END) as CANT_UNIDAD,
      SUM(CASE WHEN UPPER(IFNULL(dv.UNIDAD_MEDIDA, '''')) LIKE ''%DOCENA%'' THEN dv.CANTIDAD ELSE 0 END) as CANT_DOCENA,
      SUM(CASE WHEN UPPER(IFNULL(dv.UNIDAD_MEDIDA, '''')) LIKE ''%PAR%'' THEN dv.CANTIDAD ELSE 0 END) as CANT_PARES
    FROM ventas_online vo
    INNER JOIN detalle_ventas dv ON dv.ID_VENTA = vo.ID_VENTA
    WHERE ', @where_clause, '
    GROUP BY dv.PRODUCTO
    HAVING CANT_UNIDAD > 0 OR CANT_DOCENA > 0 OR CANT_PARES > 0
    ORDER BY CANT_UNIDAD DESC, CANT_DOCENA DESC');
  
  PREPARE stmt_productos FROM @sql_productos;
  EXECUTE stmt_productos;
  DEALLOCATE PREPARE stmt_productos;
  
  -- 4) Canal de Ventas (monto_total - el COUNT se calcula después en el backend)
  SET @sql_canales = CONCAT('
    SELECT 
      vo.CANAL_VENTA as canal_venta,
      COALESCE(SUM(dv.TOTAL), 0) as monto_total
    FROM ventas_online vo
    INNER JOIN detalle_ventas dv ON dv.ID_VENTA = vo.ID_VENTA
    WHERE ', @where_clause, '
    GROUP BY vo.CANAL_VENTA
    ORDER BY monto_total DESC');
  
  PREPARE stmt_canales FROM @sql_canales;
  EXECUTE stmt_canales;
  DEALLOCATE PREPARE stmt_canales;
  
  -- 5) Ventas por Región
  SET @sql_regiones = CONCAT('
    SELECT 
      vo.REGION as region,
      COUNT(DISTINCT vo.ID_VENTA) as cantidad,
      COALESCE(SUM(dv.TOTAL), 0) as total
    FROM ventas_online vo
    INNER JOIN detalle_ventas dv ON dv.ID_VENTA = vo.ID_VENTA
    WHERE ', @where_clause, '
    GROUP BY vo.REGION
    ORDER BY total DESC');
  
  PREPARE stmt_regiones FROM @sql_regiones;
  EXECUTE stmt_regiones;
  DEALLOCATE PREPARE stmt_regiones;
  
  -- 6) Tipos de Pago
  SET @sql_pagos = CONCAT('
    SELECT 
      vo.FORMA_DE_PAGO as pago,
      COUNT(DISTINCT vo.ID_VENTA) as cantidad,
      COALESCE(SUM(dv.TOTAL), 0) as monto_total
    FROM ventas_online vo
    INNER JOIN detalle_ventas dv ON dv.ID_VENTA = vo.ID_VENTA
    WHERE ', @where_clause, '
    GROUP BY vo.FORMA_DE_PAGO
    ORDER BY monto_total DESC');
  
  PREPARE stmt_pagos FROM @sql_pagos;
  EXECUTE stmt_pagos;
  DEALLOCATE PREPARE stmt_pagos;
  
  -- 7) Ventas por Mes
  SET @sql_mes = CONCAT('
    SELECT 
      CONCAT(YEAR(vo.FECHA), ''-'', LPAD(MONTH(vo.FECHA), 2, ''0'')) as mes,
      YEAR(vo.FECHA) as anio,
      MONTH(vo.FECHA) as mes_num,
      COALESCE(SUM(dv.TOTAL), 0) as total
    FROM ventas_online vo
    INNER JOIN detalle_ventas dv ON dv.ID_VENTA = vo.ID_VENTA
    WHERE ', @where_clause, '
    GROUP BY YEAR(vo.FECHA), MONTH(vo.FECHA), CONCAT(YEAR(vo.FECHA), ''-'', LPAD(MONTH(vo.FECHA), 2, ''0''))
    ORDER BY YEAR(vo.FECHA), MONTH(vo.FECHA)');
  
  PREPARE stmt_mes FROM @sql_mes;
  EXECUTE stmt_mes;
  DEALLOCATE PREPARE stmt_mes;
  
END$$

DELIMITER ;
