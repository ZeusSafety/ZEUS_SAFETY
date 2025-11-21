// Funcionalidad para las tarjetas del menú
document.addEventListener('DOMContentLoaded', function () {
    // Obtener todas las tarjetas
    const cards = document.querySelectorAll('.card');

    // Agregar evento click a cada tarjeta
    cards.forEach(card => {
        // Solo agregar evento click si la tarjeta no tiene enlace
        if (!card.querySelector('.card-link')) {
            card.addEventListener('click', function () {
                // Obtener el título de la tarjeta
                const title = this.querySelector('.card-title').textContent;

                // Simular navegación (aquí puedes agregar la lógica real de navegación)
                console.log(`Navegando a: ${title}`);

                // Efecto visual al hacer click
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        }

        // Efectos hover adicionales - SOLO para tarjetas SIN enlaces
        if (!card.querySelector('.card-link')) {
            card.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-4px)';
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
            });
        }
    });

    // Función para mostrar información de la tarjeta
    function showCardInfo(title, description) {
        console.log(`Tarjeta: ${title}`);
        console.log(`Descripción: ${description}`);
        // Aquí puedes agregar más funcionalidad como modales o tooltips
    }

    // Agregar tooltips informativos
    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent;
        const subtitle = card.querySelector('.card-subtitle').textContent;

        card.setAttribute('title', `${title}: ${subtitle}`);
    });
});

// LOGIN CON API

// API
const API_BASE_URL = "https://colaboradores-2946605267.us-central1.run.app";

// FUNCION PARA CONSUMIR LA API
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}?usuario=${encodeURIComponent(username)}&contrasena=${encodeURIComponent(password)}&metodo=login`);
        
        if (response.status === 200) {
            const data = await response.text();
            console.log("Respuesta de la API:", data);
            
            // Parsear la respuesta JSON
            let userData;
            try {
                userData = JSON.parse(data);
            } catch (e) {
                console.error("Error al parsear JSON:", e);
                return false;
            }
            
            // Guardar datos del usuario en localStorage
            localStorage.setItem("loggedUser", username);
            localStorage.setItem("userRoles", JSON.stringify(userData));
            
            return true;
        } else {
            console.error("Error en la respuesta de la API:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        return false;
    }
}

// CERRAR SESION
function logoutUser() {
    const username = localStorage.getItem("loggedUser");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("userRoles");
    // Limpiar cache de subvistas al cerrar sesión
    if (username) {
        localStorage.removeItem(`subvistas_${username}`);
    }
    window.location.href = "index.html";
}

// VERIFICA EL LOGIN Y MUESTRA LAS VISTAS
function loadMenu() {
    const username = localStorage.getItem("loggedUser");
    if (!username) {
        window.location.href = "index.html";
        return;
    }

    const userRolesData = localStorage.getItem("userRoles");
    if (!userRolesData) {
        console.error("No se encontraron roles del usuario");
        window.location.href = "index.html";
        return;
    }

    let userRoles;
    try {
        userRoles = JSON.parse(userRolesData);
    } catch (e) {
        console.error("Error al parsear roles del usuario:", e);
        window.location.href = "index.html";
        return;
    }

    // Extraer los nombres de las secciones permitidas
    const allowedSections = userRoles.map(role => role.NOMBRE);

    console.log("Secciones permitidas:", allowedSections);

    // Mapeo de nombres de secciones a roles de las tarjetas
    const sectionToRoleMap = {
        "MARKETING": "marketing",
        "IMPORTACION": "importacion", 
        "SISTEMAS": "sistemas",
        "VENTAS": "ventas",
        "LOGISTICA": "logistica",
        "GERENCIA": "gerencia",
        "ADMINISTRACION": "administracion",
        "RECURSOS HUMANOS": "recursos_humanos",
        "FACTURACION": "facturacion"
    };

    // Selecciona todas las cards del sidebar y del dashboard
    document.querySelectorAll(".menu-item-group[data-role], .module-card[data-role]").forEach(element => {
        const role = element.getAttribute("data-role");
        
        // Verificar si el rol de la tarjeta está en las secciones permitidas
        const isAllowed = allowedSections.some(section => 
            sectionToRoleMap[section] === role
        );
        
        if (!isAllowed) {
            element.style.display = "none";
        } else {
            element.style.display = "block";
        }
    });

    // Actualizar nombre de usuario en múltiples ubicaciones
    const usernameElements = document.querySelectorAll("#username-display, #welcome-username");
    usernameElements.forEach(element => {
        if (element) {
            element.textContent = username;
        }
    });

    // Cargar y filtrar subvistas después de cargar el menú
    loadAndFilterSubvistas(username);
}

// FUNCIÓN PARA OBTENER SUBVISTAS PERMITIDAS DEL USUARIO
async function getSubvistasPermitidas(username) {
    // Intentar obtener desde localStorage primero
    const cachedKey = `subvistas_${username}`;
    const cached = localStorage.getItem(cachedKey);
    
    // Si existe en cache y tiene menos de 5 minutos, usarlo
    if (cached) {
        try {
            const cachedData = JSON.parse(cached);
            const ahora = Date.now();
            const tiempoCache = 5 * 60 * 1000; // 5 minutos
            
            if (cachedData.timestamp && (ahora - cachedData.timestamp) < tiempoCache) {
                console.log("Subvistas obtenidas del cache");
                return cachedData.nombres || [];
            }
        } catch (e) {
            console.warn("Error al leer cache de subvistas:", e);
        }
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}?metodo=subvistas&user=${encodeURIComponent(username)}`);
        
        if (response.status === 200) {
            const data = await response.text();
            console.log("Respuesta de subvistas:", data);
            
            try {
                const subvistas = JSON.parse(data);
                // Extraer solo los nombres de las subvistas permitidas
                const nombresSubvistas = subvistas.map(subvista => subvista.NOMBRE);
                console.log("Subvistas permitidas:", nombresSubvistas);
                
                // Guardar en cache
                localStorage.setItem(cachedKey, JSON.stringify({
                    nombres: nombresSubvistas,
                    timestamp: Date.now()
                }));
                
                return nombresSubvistas;
            } catch (e) {
                console.error("Error al parsear JSON de subvistas:", e);
                return [];
            }
        } else {
            console.error("Error en la respuesta de subvistas:", response.status);
            return [];
        }
    } catch (error) {
        console.error("Error al conectar con la API de subvistas:", error);
        return [];
    }
}

// FUNCIÓN PARA FILTRAR SUBVISTAS EN EL HTML BASÁNDOSE EN COMENTARIOS
async function loadAndFilterSubvistas(username) {
    const subvistasPermitidas = await getSubvistasPermitidas(username);
    
    // Si no hay subvistas permitidas retornadas por la API, significa que:
    // El usuario no tiene acceso a ninguna subvista (hay restricción)
    // Por lo tanto, ocultamos todas las subvistas
    if (subvistasPermitidas.length === 0) {
        console.log("No hay subvistas permitidas. Ocultando todas las subvistas.");
        // Ocultar todas las subvistas cuando no hay ninguna permitida
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const commentText = node.textContent.trim();
            if (commentText.includes("SUB VISTA: NOMBRE:")) {
                // Ocultar el siguiente elemento después del comentario
                let siguiente = node.nextSibling;
                let intentos = 0;
                const maxIntentos = 5;
                
                while (siguiente && intentos < maxIntentos) {
                    intentos++;
                    
                    if (siguiente.nodeType === Node.ELEMENT_NODE) {
                        if (siguiente.tagName === 'A') {
                            const contenedor = siguiente.closest('.sub-submenu-item, .submenu-item, .menu-card');
                            if (contenedor) {
                                contenedor.style.display = 'none';
                            } else {
                                siguiente.style.display = 'none';
                            }
                            break;
                        } else if (siguiente.querySelector) {
                            const enlace = siguiente.querySelector('a');
                            if (enlace) {
                                if (siguiente.classList.contains('menu-card') ||
                                    siguiente.classList.contains('sub-submenu-item') ||
                                    siguiente.classList.contains('submenu-item')) {
                                    siguiente.style.display = 'none';
                                    break;
                                }
                            }
                        }
                    }
                    siguiente = siguiente.nextSibling;
                }
                
                // Si no se encontró en hermanos, buscar en el padre
                if (node.parentNode) {
                    const padre = node.parentNode;
                    if (padre.classList && (
                        padre.classList.contains('menu-card') ||
                        padre.classList.contains('sub-submenu-item') ||
                        padre.classList.contains('submenu-item')
                    )) {
                        const enlace = padre.querySelector('a');
                        if (enlace) {
                            padre.style.display = 'none';
                        }
                    }
                }
            }
        }
        
        // Limpiar submenús y secciones vacías (código existente)
        document.querySelectorAll('.sub-submenu, .submenu').forEach(submenu => {
            const itemsVisibles = submenu.querySelectorAll('a, .menu-card, .sub-submenu-item, .submenu-item');
            const itemsVisiblesArray = Array.from(itemsVisibles);
            const hayVisibles = itemsVisiblesArray.some(item => {
                const style = window.getComputedStyle(item);
                return style.display !== 'none' && item.closest('[style*="display: none"]') === null;
            });
            
            if (!hayVisibles && submenu.children.length > 0) {
                const todosOcultos = Array.from(submenu.children).every(child => {
                    const style = window.getComputedStyle(child);
                    return style.display === 'none';
                });
                
                if (todosOcultos) {
                    submenu.style.display = 'none';
                    const submenuGroup = submenu.closest('.submenu-group');
                    if (submenuGroup) {
                        submenuGroup.style.display = 'none';
                    }
                }
            }
        });
        
        document.querySelectorAll('.primary-section').forEach(section => {
            const sectionContent = section.querySelector('.section-content');
            if (!sectionContent) return;

            const itemsConContenido = sectionContent.querySelectorAll('.menu-card, a.btn, .menu-grid > *');
            if (itemsConContenido.length === 0) return;

            let hayVisibles = false;
            itemsConContenido.forEach(item => {
                const style = window.getComputedStyle(item);
                if (style.display !== 'none' && item.offsetParent !== null) {
                    hayVisibles = true;
                }
            });

            if (!hayVisibles) {
                section.style.display = 'none';
                const sectionName = section.querySelector('h2')?.textContent || section.querySelector('.section-header h2')?.textContent || section.id;
                console.log(`✓ Sección ocultada por falta de subvistas visibles: ${sectionName}`);
            }
        });
        
        document.querySelectorAll('.submenu-group').forEach(group => {
            const subSubmenu = group.querySelector('.sub-submenu');
            if (!subSubmenu) return;

            const subSubmenuStyle = window.getComputedStyle(subSubmenu);
            if (subSubmenuStyle.display === 'none') {
                group.style.display = 'none';
                return;
            }

            const itemsEnSubmenu = subSubmenu.querySelectorAll('a, .sub-submenu-item');
            let hayItemsVisibles = false;

            if (itemsEnSubmenu.length === 0) {
                const todosLosItems = subSubmenu.children;
                hayItemsVisibles = Array.from(todosLosItems).some(item => {
                    const itemStyle = window.getComputedStyle(item);
                    return itemStyle.display !== 'none' && item.offsetParent !== null;
                });
            } else {
                itemsEnSubmenu.forEach(item => {
                    const itemStyle = window.getComputedStyle(item);
                    if (itemStyle.display !== 'none' && item.offsetParent !== null) {
                        hayItemsVisibles = true;
                    }
                });
            }

            if (!hayItemsVisibles && itemsEnSubmenu.length > 0) {
                group.style.display = 'none';
                const groupName = group.querySelector('.submenu-header span')?.textContent || 'Grupo de submenú';
                console.log(`✓ Grupo de submenú ocultado por falta de subvistas visibles: ${groupName}`);
            }
        });
        
        return;
    }

    // Buscar todos los comentarios HTML que contengan "SUB VISTA: NOMBRE:"
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_COMMENT,
        null,
        false
    );

    const subvistasOcultar = [];
    let node;

    while (node = walker.nextNode()) {
        const commentText = node.textContent.trim();
        if (commentText.includes("SUB VISTA: NOMBRE:")) {
            // Extraer el nombre de la subvista del comentario
            const match = commentText.match(/SUB VISTA: NOMBRE:\s*(.+)/);
            if (match && match[1]) {
                const nombreSubvista = match[1].trim();
                
                // Si la subvista NO está en la lista de permitidas, la ocultamos
                if (!subvistasPermitidas.includes(nombreSubvista)) {
                    subvistasOcultar.push({
                        nombre: nombreSubvista,
                        node: node
                    });
                }
            }
        }
    }

    // Ocultar los enlaces correspondientes a las subvistas no permitidas
    subvistasOcultar.forEach(({ nombre, node }) => {
        let encontrado = false;
        
        // Buscar el siguiente elemento hermano después del comentario
        let siguiente = node.nextSibling;
        let intentos = 0;
        const maxIntentos = 5; // Limitar búsqueda a los siguientes 5 elementos
        
        // Buscar en hermanos siguientes
        while (siguiente && intentos < maxIntentos && !encontrado) {
            intentos++;
            
            if (siguiente.nodeType === Node.ELEMENT_NODE) {
                // Caso 1: Es directamente un enlace <a>
                if (siguiente.tagName === 'A') {
                    const contenedor = siguiente.closest('.sub-submenu-item, .submenu-item, .menu-card');
                    if (contenedor) {
                        contenedor.style.display = 'none';
                    } else {
                        siguiente.style.display = 'none';
                    }
                    encontrado = true;
                    console.log(`✓ Subvista ocultada: ${nombre}`);
                    break;
                }
                // Caso 2: Es un contenedor que tiene un enlace dentro (menu-card, div, etc.)
                else if (siguiente.querySelector) {
                    const enlace = siguiente.querySelector('a');
                    if (enlace) {
                        // Si el elemento contiene una clase específica de contenedor, ocultarlo
                        if (siguiente.classList.contains('menu-card') ||
                            siguiente.classList.contains('sub-submenu-item') ||
                            siguiente.classList.contains('submenu-item')) {
                            siguiente.style.display = 'none';
                            encontrado = true;
                            console.log(`✓ Subvista ocultada (contenedor): ${nombre}`);
                            break;
                        }
                    }
                }
            }
            
            siguiente = siguiente.nextSibling;
        }
        
        // Método adicional: Si el comentario está dentro de un contenedor (menu-card, etc.)
        // buscar el enlace dentro del mismo contenedor padre
        if (!encontrado && node.parentNode) {
            const padre = node.parentNode;
            // Si el padre es un contenedor de tipo menu-card o similar
            if (padre.classList && (
                padre.classList.contains('menu-card') ||
                padre.classList.contains('sub-submenu-item') ||
                padre.classList.contains('submenu-item')
            )) {
                const enlace = padre.querySelector('a');
                if (enlace) {
                    padre.style.display = 'none';
                    encontrado = true;
                    console.log(`✓ Subvista ocultada (contenedor padre): ${nombre}`);
                }
            }
        }
        
        // Si no se encontró en hermanos, buscar en el padre
        if (!encontrado && node.parentNode) {
            const padre = node.parentNode;
            
            // Buscar todos los enlaces en el padre y encontrar el primero después del comentario
            const enlaces = Array.from(padre.querySelectorAll('a'));
            const comentarioIndex = Array.from(padre.childNodes).indexOf(node);
            
            for (const enlace of enlaces) {
                // Obtener el índice del elemento padre del enlace
                let enlaceParent = enlace.parentElement;
                let enlaceIndex = -1;
                
                // Buscar en qué posición está el padre del enlace
                for (let i = 0; i < padre.childNodes.length; i++) {
                    const child = padre.childNodes[i];
                    if (child === enlaceParent || 
                        (child.nodeType === Node.ELEMENT_NODE && child.contains && child.contains(enlace))) {
                        enlaceIndex = i;
                        break;
                    }
                }
                
                // Si el enlace está después del comentario (dentro de 1-3 posiciones)
                if (enlaceIndex > comentarioIndex && enlaceIndex <= comentarioIndex + 3) {
                    const contenedor = enlace.closest('.sub-submenu-item, .submenu-item, .menu-card');
                    if (contenedor) {
                        contenedor.style.display = 'none';
                    } else {
                        enlace.style.display = 'none';
                    }
                    encontrado = true;
                    console.log(`✓ Subvista ocultada (búsqueda en padre): ${nombre}`);
                    break;
                }
            }
        }
        
        if (!encontrado) {
            console.warn(`⚠ No se pudo ocultar la subvista: ${nombre}. Verificar estructura HTML.`);
        }
    });

    // Limpiar submenús vacíos en menu.html
    document.querySelectorAll('.sub-submenu, .submenu').forEach(submenu => {
        const itemsVisibles = submenu.querySelectorAll('a, .menu-card, .sub-submenu-item, .submenu-item');
        const itemsVisiblesArray = Array.from(itemsVisibles);
        const hayVisibles = itemsVisiblesArray.some(item => {
            const style = window.getComputedStyle(item);
            return style.display !== 'none' && item.closest('[style*="display: none"]') === null;
        });
        
        if (!hayVisibles && submenu.children.length > 0) {
            // Verificar si todos los hijos están ocultos
            const todosOcultos = Array.from(submenu.children).every(child => {
                const style = window.getComputedStyle(child);
                return style.display === 'none';
            });
            
            if (todosOcultos) {
                submenu.style.display = 'none';
                // Si el submenu está vacío, ocultar también el submenu-group padre
                const submenuGroup = submenu.closest('.submenu-group');
                if (submenuGroup) {
                    submenuGroup.style.display = 'none';
                }
            }
        }
    });

    // Limpiar secciones vacías en logistica.html y otros archivos con primary-section
    document.querySelectorAll('.primary-section').forEach(section => {
        const sectionContent = section.querySelector('.section-content');
        if (!sectionContent) return;

        // Buscar todos los elementos con contenido (menu-card, enlaces, etc.)
        const itemsConContenido = sectionContent.querySelectorAll('.menu-card, a.btn, .menu-grid > *');
        
        // Si no hay items con contenido, no ocultar (puede ser una sección sin restricciones)
        if (itemsConContenido.length === 0) return;

        let hayVisibles = false;

        itemsConContenido.forEach(item => {
            const style = window.getComputedStyle(item);
            // Verificar si el elemento está visible
            if (style.display !== 'none') {
                // Verificar también que no esté dentro de un padre oculto usando offsetParent
                // offsetParent es null si el elemento está oculto
                if (item.offsetParent !== null) {
                    hayVisibles = true;
                }
            }
        });

        // Si no hay elementos visibles y había items con contenido, ocultar toda la sección
        if (!hayVisibles) {
            section.style.display = 'none';
            const sectionName = section.querySelector('h2')?.textContent || section.querySelector('.section-header h2')?.textContent || section.id;
            console.log(`✓ Sección ocultada por falta de subvistas visibles: ${sectionName}`);
        }
    });

    // Limpiar grupos de submenú vacíos en menu.html
    document.querySelectorAll('.submenu-group').forEach(group => {
        const subSubmenu = group.querySelector('.sub-submenu');
        if (!subSubmenu) return;

        // Verificar si el sub-submenu está oculto o vacío
        const subSubmenuStyle = window.getComputedStyle(subSubmenu);
        
        // Si el sub-submenu está explícitamente oculto, ocultar el grupo
        if (subSubmenuStyle.display === 'none') {
            group.style.display = 'none';
            console.log(`✓ Grupo de submenú ocultado (sub-submenu oculto)`);
            return;
        }

        // Verificar si hay items visibles en el sub-submenu
        const itemsEnSubmenu = subSubmenu.querySelectorAll('a, .sub-submenu-item');
        let hayItemsVisibles = false;

        if (itemsEnSubmenu.length === 0) {
            // Si no hay items, verificar si el submenu está realmente vacío
            const todosLosItems = subSubmenu.children;
            hayItemsVisibles = Array.from(todosLosItems).some(item => {
                const itemStyle = window.getComputedStyle(item);
                return itemStyle.display !== 'none' && item.offsetParent !== null;
            });
        } else {
            itemsEnSubmenu.forEach(item => {
                const itemStyle = window.getComputedStyle(item);
                if (itemStyle.display !== 'none' && item.offsetParent !== null) {
                    hayItemsVisibles = true;
                }
            });
        }

        // Si no hay items visibles y había items originalmente, ocultar el grupo completo
        if (!hayItemsVisibles && itemsEnSubmenu.length > 0) {
            group.style.display = 'none';
            const groupName = group.querySelector('.submenu-header span')?.textContent || 'Grupo de submenú';
            console.log(`✓ Grupo de submenú ocultado por falta de subvistas visibles: ${groupName}`);
        }
    });
}

// FUNCIONES MEJORADAS PARA EL MENÚ RESPONSIVE
function toggleSubmenu(moduleName) {
    const submenu = document.getElementById(moduleName + '-submenu');
    const header = document.querySelector(`[onclick="toggleSubmenu('${moduleName}')"]`);
    
    if (!submenu || !header) return;
    
    const isOpen = submenu.classList.contains('open');
    
    // Cerrar otros submenús abiertos en móviles para evitar overflow
    if (window.innerWidth <= 768 && !isOpen) {
        document.querySelectorAll('.submenu.open').forEach(openSubmenu => {
            if (openSubmenu !== submenu) {
                openSubmenu.classList.remove('open');
                const openHeader = document.querySelector(`[onclick*="${openSubmenu.id.replace('-submenu', '')}"]`);
                if (openHeader) openHeader.classList.remove('active');
            }
        });
    }
    
    // Toggle submenu
    submenu.classList.toggle('open');
    header.classList.toggle('active');
    
    // Smooth scroll para asegurar que el contenido sea visible en móviles
    if (window.innerWidth <= 768 && submenu.classList.contains('open')) {
        setTimeout(() => {
            header.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'nearest'
            });
        }, 100);
    }
}

function toggleSubSubmenu(submenuName) {
    const subSubmenu = document.getElementById(submenuName + '-submenu');
    const header = document.querySelector(`[onclick="toggleSubSubmenu('${submenuName}')"]`);
    
    if (!subSubmenu || !header) return;
    
    const isOpen = subSubmenu.classList.contains('open');
    
    // Cerrar otros sub-submenús abiertos en móviles
    if (window.innerWidth <= 768 && !isOpen) {
        document.querySelectorAll('.sub-submenu.open').forEach(openSubSubmenu => {
            if (openSubSubmenu !== subSubmenu) {
                openSubSubmenu.classList.remove('open');
                const openHeader = document.querySelector(`[onclick*="${openSubSubmenu.id.replace('-submenu', '')}"]`);
                if (openHeader) openHeader.classList.remove('active');
            }
        });
    }
    
    // Toggle sub-submenu
    subSubmenu.classList.toggle('open');
    header.classList.toggle('active');
    
    // Smooth scroll para móviles
    if (window.innerWidth <= 768 && subSubmenu.classList.contains('open')) {
        setTimeout(() => {
            header.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'nearest'
            });
        }, 100);
    }
}

// Cerrar menús cuando se hace clic fuera en móviles
document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggleMobile');
        
        // Si el clic no es dentro del sidebar ni en el botón de toggle
        if (sidebar && !sidebar.contains(event.target) && 
            sidebarToggle && !sidebarToggle.contains(event.target)) {
            
            // Cerrar sidebar si está abierto
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.getElementById('sidebarOverlay')?.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }
});

// Manejar resize de ventana
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    // Si cambiamos a desktop, asegurar que el sidebar esté en su estado correcto
    if (window.innerWidth >= 1024) {
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }
});


