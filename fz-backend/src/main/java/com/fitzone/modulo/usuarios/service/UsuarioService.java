package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SedeRepository sedeRepository;
    private final SupabaseAuthClient supabaseAuthClient;

    @Transactional(readOnly = true)
    public Usuario obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
    }

    @Transactional(readOnly = true)
    public List<Usuario> buscar(String dni, TipoUsuario tipoUsuario) {
        return buscar(dni, tipoUsuario, null);
    }

    @Transactional(readOnly = true)
    public List<Usuario> buscar(String dni, TipoUsuario tipoUsuario, Long idSede) {
        String dniLimpio = (dni != null && !dni.isBlank()) ? dni.trim() : null;

        if (dniLimpio != null && tipoUsuario != null && idSede != null) {
            return usuarioRepository.findByDniAndTipoUsuarioAndIdSede(dniLimpio, tipoUsuario, idSede);
        }
        if (dniLimpio != null && idSede != null) {
            return usuarioRepository.findByDniAndIdSede(dniLimpio, idSede).map(List::of).orElseGet(List::of);
        }
        if (dniLimpio != null && tipoUsuario != null) {
            return usuarioRepository.findByDniAndTipoUsuario(dniLimpio, tipoUsuario);
        }
        if (dniLimpio != null) {
            return usuarioRepository.findByDni(dniLimpio).map(List::of).orElseGet(List::of);
        }
        if (tipoUsuario != null && idSede != null) {
            return usuarioRepository.findByTipoUsuarioAndIdSede(tipoUsuario, idSede);
        }
        if (tipoUsuario != null) {
            return usuarioRepository.findByTipoUsuario(tipoUsuario);
        }
        if (idSede != null) {
            return usuarioRepository.findByIdSede(idSede);
        }
        return usuarioRepository.findAll();
    }

    @Transactional
    public Usuario crear(Usuario usuario, Long idOperador) {
        Long operadorEfectivo = (idOperador != null) ? idOperador : 1L;
        validarOperadorParaCreacion(operadorEfectivo, usuario.getTipoUsuario());

        String dniLimpio = usuario.getDni() != null ? usuario.getDni().trim() : "";
        usuario.setDni(dniLimpio);

        if (usuarioRepository.existsByDni(usuario.getDni())) {
            throw new ConflictoException("Ya existe un usuario con el DNI " + usuario.getDni());
        }

        usuario.setIdUsuario(null);
        usuario.setDeleted(false);
        usuario.setDeletedAt(null);

        // Para SOCIO y EXTERNO se descarta cualquier sede enviada por el front
        if (usuario.getTipoUsuario() == TipoUsuario.SOCIO || usuario.getTipoUsuario() == TipoUsuario.EXTERNO) {
            usuario.setIdSede(null);
        } else {
            validarReglaSede(usuario.getTipoUsuario(), usuario.getIdSede());
        }

        // Flujo EXTERNO (checkout de invitado): no posee cuenta en Supabase Auth
        if (usuario.getTipoUsuario() == TipoUsuario.EXTERNO) {
            usuario.setAuthId(null);
            return usuarioRepository.save(usuario);
        }

        // Flujo para SOCIO, RECEPCIONISTA y GERENTE: creación en Supabase Auth
        UUID authId;
        Map<String, Object> metadatos = new HashMap<>();
        metadatos.put("nombre", usuario.getNombre());
        metadatos.put("apellido", usuario.getApellido());
        metadatos.put("tipo_usuario", usuario.getTipoUsuario().name());

        if (supabaseAuthClient.isAltaPorEmail()) {
            authId = supabaseAuthClient.invitarUsuario(usuario.getEmail(), metadatos);
        } else {
            if (usuario.getPassword() == null || usuario.getPassword().length() < 6) {
                throw new ReglaNegocioException("La contraseña inicial es obligatoria y debe tener al menos 6 caracteres");
            }
            authId = supabaseAuthClient.crearUsuarioConfirmado(usuario.getEmail(), usuario.getPassword(), metadatos);
        }

        usuario.setAuthId(authId);

        try {
            return usuarioRepository.saveAndFlush(usuario);
        } catch (Exception ex) {
            log.error("Error al persistir usuario con authId {} en la BD. Ejecutando compensación en Supabase Auth...", authId, ex);
            try {
                supabaseAuthClient.eliminarUsuario(authId);
            } catch (Exception supEx) {
                log.error("Fallo crítico al eliminar cuenta huérfana en Supabase Auth (authId {}): {}", authId, supEx.getMessage());
            }
            throw ex;
        }
    }

    @Transactional
    public Usuario actualizar(Long id, Usuario datos, Long idOperador) {
        Long operadorEfectivo = (idOperador != null) ? idOperador : 1L;
        Usuario existente = obtenerPorId(id);
        Usuario operador = obtenerPorId(operadorEfectivo);

        validarOperadorParaEdicion(operador, existente, datos.getTipoUsuario());

        // El DNI no se edita (se ignora el valor enviado en datos)
        existente.setNombre(datos.getNombre());
        existente.setApellido(datos.getApellido());
        existente.setTelefono(datos.getTelefono());
        existente.setFotoUrl(datos.getFotoUrl());

        // Manejo de cambio de rol (si se especificó uno diferente)
        if (datos.getTipoUsuario() != null && datos.getTipoUsuario() != existente.getTipoUsuario()) {
            gestionarCambioDeRol(existente, datos);
        }

        // Validación y asignación de sede para el tipo final
        if (existente.getTipoUsuario() == TipoUsuario.SOCIO || existente.getTipoUsuario() == TipoUsuario.EXTERNO) {
            existente.setIdSede(null);
        } else {
            validarReglaSede(existente.getTipoUsuario(), datos.getIdSede());
            existente.setIdSede(datos.getIdSede());
        }

        // Sincronización de cambio de email con Supabase Auth
        boolean emailCambio = !existente.getEmail().equalsIgnoreCase(datos.getEmail());
        if (emailCambio) {
            existente.setEmail(datos.getEmail());
            // Guardar primero en BD: si la BD falla, no se toca Supabase
            Usuario guardado = usuarioRepository.saveAndFlush(existente);
            if (guardado.getAuthId() != null) {
                // Si Supabase falla, la excepción lanzada produce el rollback de la transacción de BD
                supabaseAuthClient.actualizarEmail(guardado.getAuthId(), datos.getEmail());
            }
            return guardado;
        }

        return usuarioRepository.save(existente);
    }

    private void validarOperadorParaCreacion(Long idOperador, TipoUsuario tipoNuevoUsuario) {
        Usuario operador = obtenerPorId(idOperador);
        if (operador.getTipoUsuario() == TipoUsuario.SOCIO || operador.getTipoUsuario() == TipoUsuario.EXTERNO) {
            throw new AccesoDenegadoException("Solo recepcionistas o gerentes pueden dar de alta usuarios");
        }
        if ((tipoNuevoUsuario == TipoUsuario.RECEPCIONISTA || tipoNuevoUsuario == TipoUsuario.GERENTE)
                && operador.getTipoUsuario() != TipoUsuario.GERENTE) {
            throw new AccesoDenegadoException("Solo un gerente puede dar de alta personal (recepcionistas o gerentes)");
        }
    }

    private void validarOperadorParaEdicion(Usuario operador, Usuario objetivo, TipoUsuario tipoNuevo) {
        if (operador.getTipoUsuario() == TipoUsuario.SOCIO || operador.getTipoUsuario() == TipoUsuario.EXTERNO) {
            throw new AccesoDenegadoException("Solo recepcionistas o gerentes pueden editar usuarios");
        }
        // Solo un gerente puede editar personal (recepcionista o gerente)
        if ((objetivo.getTipoUsuario() == TipoUsuario.RECEPCIONISTA || objetivo.getTipoUsuario() == TipoUsuario.GERENTE)
                && operador.getTipoUsuario() != TipoUsuario.GERENTE) {
            throw new AccesoDenegadoException("Solo un gerente puede modificar los datos de personal (recepcionistas o gerentes)");
        }
        // Solo un gerente puede cambiar el tipo de usuario / asignar roles
        if (tipoNuevo != null && tipoNuevo != objetivo.getTipoUsuario() && operador.getTipoUsuario() != TipoUsuario.GERENTE) {
            throw new AccesoDenegadoException("Solo un gerente puede cambiar el rol o tipo de un usuario");
        }
    }

    private void gestionarCambioDeRol(Usuario existente, Usuario datos) {
        TipoUsuario tipoAnterior = existente.getTipoUsuario();
        TipoUsuario tipoNuevo = datos.getTipoUsuario();

        if (tipoAnterior != TipoUsuario.EXTERNO && tipoNuevo == TipoUsuario.EXTERNO) {
            throw new ReglaNegocioException("No se permite degradar un usuario con cuenta registrada a tipo EXTERNO");
        }

        if (tipoAnterior == TipoUsuario.EXTERNO && tipoNuevo != TipoUsuario.EXTERNO) {
            // Usuario externo pasando a socio o empleado: requiere crear su cuenta en Supabase Auth
            Map<String, Object> metadatos = new HashMap<>();
            metadatos.put("nombre", existente.getNombre());
            metadatos.put("apellido", existente.getApellido());
            metadatos.put("tipo_usuario", tipoNuevo.name());

            UUID authId;
            if (supabaseAuthClient.isAltaPorEmail()) {
                authId = supabaseAuthClient.invitarUsuario(existente.getEmail(), metadatos);
            } else {
                if (datos.getPassword() == null || datos.getPassword().length() < 6) {
                    throw new ReglaNegocioException("Para asignar cuenta al usuario se requiere una contraseña de al menos 6 caracteres");
                }
                authId = supabaseAuthClient.crearUsuarioConfirmado(existente.getEmail(), datos.getPassword(), metadatos);
            }
            existente.setAuthId(authId);
        }

        existente.setTipoUsuario(tipoNuevo);
    }

    private void validarReglaSede(TipoUsuario tipoUsuario, Long idSede) {
        if (tipoUsuario == TipoUsuario.RECEPCIONISTA || tipoUsuario == TipoUsuario.GERENTE) {
            if (idSede == null) {
                throw new ReglaNegocioException("Los usuarios " + tipoUsuario + " deben tener una sede asignada");
            }
            if (!sedeRepository.existsById(idSede)) {
                throw new RecursoNoEncontradoException("Sede", idSede);
            }
        }
    }
}
