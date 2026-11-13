package com.fitzone.modulo.pagos.models;

import jakarta.persistence.Column;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TransaccionTest {

    @Test
    @DisplayName("El código de reintento se asigna después del primer guardado, así que la columna tiene que ser actualizable")
    void codigoReintento_columnaActualizable() throws NoSuchFieldException {
        Column columna = Transaccion.class.getDeclaredField("codigoReintento").getAnnotation(Column.class);

        assertThat(columna.updatable()).isTrue();
        assertThat(columna.unique()).isTrue();
    }
}
