// src/pages/api/record/owner/paginated.ts
import { getAllPaymentsById } from "../payment/getPayment";

export async function GET({ request }: { request: Request }) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const page = parseInt(url.searchParams.get('page') || '1');
        const perPage = parseInt(url.searchParams.get('perPage') || '10');
        
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID requerido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Obtener todos los datos (reutilizar tu función existente)
        const result = await getAllPaymentsById({ id });
        const todosLosPagos = Array.isArray(result) ? result : await result.json().catch(() => []);
        
        // Ordenar por fecha
        todosLosPagos.sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
        
        // Calcular paginación
        const totalRegistros = todosLosPagos.length;
        const totalPaginas = perPage === -1 ? 1 : Math.ceil(totalRegistros / perPage);
        
        // Obtener datos para la página actual
        let pagosPaginados;
        if (perPage === -1) {
            pagosPaginados = todosLosPagos;
        } else {
            const inicio = (page - 1) * perPage;
            const fin = inicio + perPage;
            pagosPaginados = todosLosPagos.slice(inicio, fin);
        }
        
        return new Response(JSON.stringify({
            data: pagosPaginados,
            pagination: {
                currentPage: page,
                totalPages: totalPaginas,
                totalRecords: totalRegistros,
                perPage: perPage
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Error en API paginada:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
