window.addEventListener('DOMContentLoaded', () => {
    let pageNumber = 0;
    let totalPages = 0;
    loadAdminPanel();

    //Reset the page on 'count per page' changes
    $('#page-size').on('change', function () {
        pageNumber = 0;
        loadAdminPanel();
    });

    //Reloads the whole admin panel
    function loadAdminPanel() {
        const pageSize = parseInt($('#page-size').val());
        $.ajax({
            url: '/rest/players/count',
            method: 'GET',
            success: playerCount => {
                totalPages = Math.ceil(playerCount / pageSize);
                buildPagination(totalPages);
                fetchPlayerTable(pageNumber, pageSize);
            }
        });
    }

    //Fills the player table
    function fetchPlayerTable(page, size) {
        $.ajax({
            url: '/rest/players',
            method: 'GET',
            data: {
                pageNumber: page,
                pageSize: size
            },
            success: data => {
                $('#table-body').empty();
                $.each(data, (_index, item) => {
                    const birthday = new Date(item.birthday).toLocaleDateString(
                        'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }
                    );
                    const banned = item.banned ? 'Yes' : 'No';
                    const row = `<tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.title}</td>
                            <td>${item.race}</td>
                            <td>${item.profession}</td>
                            <td>${item.level}</td>
                            <td>${birthday}</td>
                            <td>${banned}</td>
                        </tr>`;
                    $('#table-body').append(row);
                });
            }
        });
    }

    //Builds the list of pages
    function buildPagination(totalPages) {
         $('#pages-list').empty();

        for (let i = 0; i < totalPages; i++) {
            const $pageLink = $('<button>').text(i + 1).addClass('page-btn');
            if (i === pageNumber) $pageLink.addClass('active');

            //Update the current page on a page change
            $pageLink.on('click', function () {
                if ($(this).hasClass('active')) return;

                $('#pages-list').find('.page-btn.active').removeClass('active');
                $(this).addClass('active');
                pageNumber = i; //works because of closure

                const pageSize = parseInt($('#page-size').val());
                fetchPlayerTable(pageNumber, pageSize);
            });
            $('#pages-list').append($pageLink);
        }
    }
});
