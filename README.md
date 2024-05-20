### PORTAL NOTICIAS

![](https://res.cloudinary.com/dzckgibkj/image/upload/v1704200820/gsv8m6jvjyxjuia46tmb.png)

Portal Noticias Es una aplicacion creada con React, Node js, y Postgress, en la cual puedes visualizar, crear, editar y eliminar noticias.

El proyecto se encuentra deployado en Vercel y puedes acceder a el con el siguiente Link:
#https://lomo-front.vercel.app/


La aplicación consiste en una página principal, en donde se consulta una api externa para saber el precio actual del dolar y el euro, Se visualizaran todas las noticias que el administrador haya creado, si hacemos click en alguna noticias, esta nos llevará al detalle de dicha noticia, en donde podras leer mas acerca de ella.

**Para poder acceder a las acciones de* crear, editar y eliminar *, debes primero estar logeado.**

Se utlizo **bycrpt** para encriptar la contraseña y **JWT** para generar tokens y asi poder utilizar los endpoints de crear, editar, y eliminar.

Una vez logeados, nos vamos a encontrar en el Navbar, **"PORTAL"**, que únicamente aparecerá si el usuario inició sesión.

Cuando ingresemos a PORTAL, vamos a ver un pequeño dashboard de administrador, en el cual podremos gestionar todas nuestras noticias. A continuación se explicará el funcionamiento de cada una de las opciones

- **CREAR** : En este apartado el usuario podra crear Noticias, deberemos agregar una ***imagen*** en formato (jpg, png, jpng), se utilizó **cloudinary** para alamacenar las imagenes. Agregar un*** Título***, un pequeño ***resumen*** de la noticia, y finalmente una ***descripcion***, que esta únicamente la veremos cuando accedamos a la noticia.

- **VIGENTES** : En este apartado podremos editar noticias creadas, y eliminarlas. Si eliminamos una noticia, esta desaparecera del *Home*, pero la noticia no se elimina en si, sino que se deshabilita para que no se puede visualizar, Posteriormente podremos habilitarla nuevamente desde la siguiente sección.

- **ELIMINADAS**: Este es el ultimo apartado del dashbord, aca encontraremos las noticias que eliminamos, y tendremos la posibilidad de reestablecerlas, haciendo que vuelvan a aparecer en el *Home*.
