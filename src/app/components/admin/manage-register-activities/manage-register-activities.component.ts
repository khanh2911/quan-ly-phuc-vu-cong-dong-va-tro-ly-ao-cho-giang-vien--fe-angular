import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DangKyHoatDongService } from 'src/app/services/dang-ky-hoat-dong.service';
import { DangKyHoatDong } from 'src/app/models/DangKyHoatDong';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { B } from '@angular/cdk/keycodes';
import { AdminDestroyActivityComponent } from './admin-destroy-activity/admin-destroy-activity.component';
import { WebSocketService } from 'src/app/services/web-socket.service';

@Component({
  selector: 'app-manage-register-activities',
  templateUrl: './manage-register-activities.component.html',
  styleUrls: ['./manage-register-activities.component.css'],
})
export class ManageRegisterActivitiesComponent implements OnInit, OnDestroy{
  danhSachDangKy: MatTableDataSource<DangKyHoatDong> = new MatTableDataSource();
  displayedColumns: string[] = [
    'stt',
    'hoatDong.tenHoatDong',
    'giangVien.taiKhoan.tenDayDu',
    'hanhdong',
  ];
  length: number = 0;
  searchTerm: string = '';
  public startTime!: Date | null;
  public endTime!: Date | null;
  public status: string = 'Chua_Duyet';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dangKyHoatDongService: DangKyHoatDongService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private webSocketService: WebSocketService,
  ) {}
  public filterVisible: boolean = true;

  toggleFilter() {
    this.filterVisible = !this.filterVisible;
  }
  ngOnInit(): void {
    this.loadDanhSachDangKy();
    this.connectWebsocket();
  }

  connectWebsocket(){
    console.log('ManageRegisterActivitiesComponent')
    this.webSocketService.connect("admin");

    this.webSocketService.messageEvent.subscribe((data) => {
      if(data==='register-activity'){
        this.loadDanhSachDangKy()
      }
    });
  }
  ngAfterViewInit() {
    this.danhSachDangKy.paginator = this.paginator;
    this.danhSachDangKy.sort = this.sort;
    this.paginator.page.subscribe(() => {
      this.loadDanhSachDangKy(
        this.paginator.pageIndex,
        this.paginator.pageSize,
        this.sort.active,
        this.sort.direction
      );
    });

    this.sort.sortChange.subscribe(() => {
      this.loadDanhSachDangKy(
        this.paginator.pageIndex,
        this.paginator.pageSize,
        this.sort.active,
        this.sort.direction
      );
    });
  }

  loadDanhSachDangKy(
    page: number = 0,
    size: number = 5,
    sortBy: string = 'hoatDong.ngayTao',
    sortDir: string = 'DESC',
    status: any = this.status
  ) {
    this.dangKyHoatDongService
      .layDanhSachTatCaDangKyHoatDong(
        page,
        size,
        sortBy,
        sortDir,
        this.searchTerm,
        status,
        this.startTime,
        this.endTime
      )
      .subscribe((data) => {
        console.log(data);
        this.danhSachDangKy = new MatTableDataSource<any>(data.content);
        this.paginator.length = data.totalElements;
        this.length = data.totalElements;
      });
  }

  onSearch() {
    this.status = '';
    this.loadDanhSachDangKy();
  }
  filter() {
    this.loadDanhSachDangKy(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.sort.active,
      this.sort.direction,
      this.status
    );
  }
  refresh() {
    this.searchTerm = '';
    this.status = '';
    this.startTime = null;
    this.endTime = null;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadDanhSachDangKy();
  }
  duyet(id: number) {
    this.dangKyHoatDongService.approveDangKyHoatDong(id).subscribe({
      next: (data) => {
        if (data.message && data.message === 'hoatdong-exist') {
          this.toastr.warning('Bạn đã duyệt đăng ký hoạt động này rồi!');
        } else {
          this.loadDanhSachDangKy()
          this.toastr.success('Đăng ký thành công!');
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  huy(item:any){
    this.openDialog(item, true);
    console.log(item)
  }

  xemChiTiet(item:any){
    this.openDialog(item, false);
  }

  openDialog(item: number, isEditable: boolean) {
    var popup = this.dialog.open(AdminDestroyActivityComponent, {
      data: {
        item: item,
        isEditable: isEditable
      },
      width: '50%',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
    });
    popup.afterClosed().subscribe((item) => {
      this.loadDanhSachDangKy();
    });
  }
  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }
}